import { useEffect, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Loader2 } from 'lucide-react';

export function VisitorCounter() {
  const [count, setCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCount = async () => {
      try {
        const statsRef = doc(db, 'meta', 'visitors');
        const snap = await getDoc(statsRef);
        if (snap.exists()) {
          setCount(snap.data().count);
        } else {
          setCount(0);
        }
      } catch (e) {
        console.error('Error fetching visitor count', e);
      } finally {
        setLoading(false);
      }
    };
    fetchCount();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center gap-1.5 text-xs text-gray-400">
        <Loader2 className="h-3 w-3 animate-spin" />
        <span>جاري تحميل إحصائيات الزوار...</span>
      </div>
    );
  }

  return (
    <div className="text-xs font-bold text-gray-300">
      إجمالي زوار المتجر: <span className="text-[#38BDF8] tabular-nums">{count !== null ? count : 'غير متاح'}</span>
    </div>
  );
}
