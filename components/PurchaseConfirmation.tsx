import { motion, useReducedMotion } from 'motion/react';
import { Wordmark } from './Wordmark';

interface PurchaseConfirmationProps {
  orderNumber: string;
  deliveryLine: string;
  onClose: () => void;
}

/**
 * The blue moment: the only fully accent-coloured screen in the app.
 * Shown after a purchase. Wipes in from the bottom; with
 * prefers-reduced-motion it appears without movement.
 */
export function PurchaseConfirmation({ orderNumber, deliveryLine, onClose }: PurchaseConfirmationProps) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      role="dialog"
      aria-label="Bought"
      initial={reduceMotion ? { opacity: 0 } : { clipPath: 'inset(100% 0 0 0)' }}
      animate={reduceMotion ? { opacity: 1 } : { clipPath: 'inset(0% 0 0 0)' }}
      exit={{ opacity: 0 }}
      transition={{ duration: reduceMotion ? 0 : 0.25, ease: 'easeOut' }}
      className="fixed inset-0 z-[100] bg-accent text-on-accent flex flex-col px-6 pt-6"
      style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 1.5rem)' }}
    >
      <Wordmark className="text-lg" />

      <div className="flex-1 flex flex-col justify-end pb-10">
        <h1 className="type-hero">
          Bought.<br />No bag.
        </h1>
        <p className="type-data mt-6">Order {orderNumber}</p>
        <p className="type-data">{deliveryLine}</p>
      </div>

      <button
        onClick={onClose}
        className="w-full h-14 rounded-sm border border-on-accent text-on-accent font-medium text-base active:opacity-70"
      >
        Close
      </button>
    </motion.div>
  );
}
