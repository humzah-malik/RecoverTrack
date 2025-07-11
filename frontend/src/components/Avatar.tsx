import type { UserOut } from '../api/auth';
import { pastelFromName } from '../utils/pastelFromName';
import clsx from 'clsx';

/** size prop: e.g. 24 → w-24 h-24; defaults to 24 */
export const Avatar = ({
  user,
  size = 24,
  className = '',
}: {
  user: UserOut;
  size?: number;
  className?: string;
}) => {
  const sizeStyle = { width: `${size}rem`, height: `${size}rem` };

  if (user.avatar_url) {
    return (
      <img
        src={user.avatar_url}
        alt="avatar"
        style={sizeStyle} className={clsx('rounded-full object-cover', className)}
      />
    );
  }

  const bg = pastelFromName(user.first_name || '');
  return (
    <div
    style={{ ...sizeStyle, background: bg }}
    className={clsx(
    'rounded-full flex items-center justify-center text-white font-semibold text-xl',
    className
    )}
    >
    {(user.first_name || 'A')[0].toUpperCase()}
    </div>
  );
};