import toast from 'react-hot-toast';

export const notify = {
  success: (msg: string) => toast.success(msg, { duration: 4000 }),
  error: (msg: string) => toast.error(msg, { duration: 4000 }),
  loading: (msg: string) => toast.loading(msg),
  promise: <T,>(
    promise: Promise<T>,
    messages: { loading: string; success: string; error: string }
  ) => toast.promise(promise, messages, { duration: 4000 }),
};

