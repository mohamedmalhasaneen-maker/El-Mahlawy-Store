import { initializeApp } from 'firebase/app';
import {
  GoogleAuthProvider,
  User,
  getAuth,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
} from 'firebase/auth';
import {
  Timestamp,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocFromServer,
  getFirestore,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { OperationType, Product, ProductFormInput } from '../types/store';
import { sanitizeProductPayload } from '../utils/catalogLogic';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);

export const BOOTSTRAPPED_ADMIN_EMAIL = 'mohamed.m.alhasaneen@gmail.com';

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid ?? null,
      email: auth.currentUser?.email ?? null,
      emailVerified: auth.currentUser?.emailVerified ?? null,
      isAnonymous: auth.currentUser?.isAnonymous ?? null,
      tenantId: auth.currentUser?.tenantId ?? null,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export async function testFirestoreConnection(): Promise<void> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('Please check your Firebase configuration.');
    }
  }
}

// Run mandatory boot validation check
void testFirestoreConnection();

function timestampToIso(value: unknown): string {
  if (value instanceof Timestamp) {
    return value.toDate().toISOString();
  }
  if (typeof value === 'string') {
    return value;
  }
  return new Date().toISOString();
}

export function mapDocToProduct(id: string, data: Record<string, unknown>): Product {
  return {
    id: typeof data.id === 'string' ? data.id : id,
    name: String(data.name ?? ''),
    brand: String(data.brand ?? ''),
    category: String(data.category ?? 'إكسسوارات ذكية'),
    shortDescription: String(data.shortDescription ?? ''),
    description: String(data.description ?? ''),
    price: Number(data.price ?? 0),
    originalPrice: Number(data.originalPrice ?? data.price ?? 0),
    discountEnabled: Boolean(data.discountEnabled),
    inStock: Boolean(data.inStock),
    isFeatured: Boolean(data.isFeatured),
    isPublished: data.isPublished !== false,
    images: Array.isArray(data.images) ? data.images.map(String) : [],
    specs: Array.isArray(data.specs) ? data.specs.map(String) : [],
    options: Array.isArray(data.options) ? data.options.map(String) : [],
    authorUid: String(data.authorUid ?? 'admin'),
    createdAt: timestampToIso(data.createdAt),
    updatedAt: timestampToIso(data.updatedAt),
  };
}

export function subscribeToPublishedProducts(
  onProducts: (products: Product[]) => void,
  onErrorCallback?: (err: Error) => void
): () => void {
  const path = 'products';
  const q = query(collection(db, path), where('isPublished', '==', true));
  return onSnapshot(
    q,
    (snapshot) => {
      const items = snapshot.docs.map((d) =>
        mapDocToProduct(d.id, d.data() as Record<string, unknown>)
      );
      onProducts(items);
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, path);
      } catch (formattedErr) {
        if (onErrorCallback && formattedErr instanceof Error) {
          onErrorCallback(formattedErr);
        }
      }
    }
  );
}

export async function checkUserIsCloudAdmin(user: User | null): Promise<boolean> {
  if (!user || !user.emailVerified) return false;
  if (user.email?.toLowerCase() === BOOTSTRAPPED_ADMIN_EMAIL.toLowerCase()) {
    return true;
  }
  const path = `admins/${user.uid}`;
  try {
    const snap = await getDoc(doc(db, 'admins', user.uid));
    return snap.exists();
  } catch (error) {
    if (error instanceof Error && error.message.includes('Missing or insufficient permissions')) {
      handleFirestoreError(error, OperationType.GET, path);
    }
    return false;
  }
}

export async function signInAdminWithGoogle(): Promise<User> {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });
  const result = await signInWithPopup(auth, provider);
  return result.user;
}

export async function signOutAdmin(): Promise<void> {
  await signOut(auth);
}

export { onAuthStateChanged };
export type { User };

export async function createCloudProduct(
  input: ProductFormInput,
  authorUid: string,
  customId?: string
): Promise<Product> {
  const sanitized = sanitizeProductPayload(input, customId, authorUid);
  const path = `products/${sanitized.id}`;
  try {
    await setDoc(doc(db, 'products', sanitized.id), {
      id: sanitized.id,
      name: sanitized.name,
      brand: sanitized.brand,
      category: sanitized.category,
      shortDescription: sanitized.shortDescription,
      description: sanitized.description,
      price: sanitized.price,
      originalPrice: sanitized.originalPrice,
      discountEnabled: sanitized.discountEnabled,
      inStock: sanitized.inStock,
      isFeatured: sanitized.isFeatured,
      isPublished: sanitized.isPublished,
      images: sanitized.images,
      specs: sanitized.specs,
      options: sanitized.options,
      authorUid: sanitized.authorUid,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return sanitized;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function updateCloudProduct(
  productId: string,
  input: ProductFormInput,
  existingAuthorUid: string
): Promise<Product> {
  const sanitized = sanitizeProductPayload(input, productId, existingAuthorUid);
  const path = `products/${productId}`;
  try {
    await updateDoc(doc(db, 'products', productId), {
      name: sanitized.name,
      brand: sanitized.brand,
      category: sanitized.category,
      shortDescription: sanitized.shortDescription,
      description: sanitized.description,
      price: sanitized.price,
      originalPrice: sanitized.originalPrice,
      discountEnabled: sanitized.discountEnabled,
      inStock: sanitized.inStock,
      isFeatured: sanitized.isFeatured,
      isPublished: sanitized.isPublished,
      images: sanitized.images,
      specs: sanitized.specs,
      options: sanitized.options,
      updatedAt: serverTimestamp(),
    });
    return sanitized;
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deleteCloudProduct(productId: string): Promise<void> {
  const path = `products/${productId}`;
  try {
    await deleteDoc(doc(db, 'products', productId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}
