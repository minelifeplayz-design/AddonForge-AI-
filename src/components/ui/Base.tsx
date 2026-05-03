import { motion } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'cyber';
  size?: 'sm' | 'md' | 'lg';
  glow?: boolean;
}

export const Button = ({
  className,
  variant = 'primary',
  size = 'md',
  glow = true,
  ...props
}: ButtonProps) => {
  const variants = {
    primary: 'bg-neon-purple text-white hover:bg-neon-purple/90',
    secondary: 'bg-neon-cyan text-white hover:bg-neon-cyan/90',
    outline: 'border border-white/20 hover:bg-white/10 text-white',
    ghost: 'hover:bg-white/5 text-gray-400 hover:text-white',
    cyber: 'bg-transparent border border-neon-purple text-neon-purple hover:bg-neon-purple hover:text-white neon-border-purple',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base font-semibold',
  };

  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={cn(
        'relative inline-flex items-center justify-center rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-neon-purple/50 active:ring-0 disabled:opacity-50 disabled:pointer-events-none overflow-hidden',
        variants[variant],
        sizes[size],
        glow && variant === 'primary' && 'neon-glow-purple',
        glow && variant === 'secondary' && 'neon-glow-cyan',
        className
      )}
      {...(props as any)}
    />
  );
};

export const Card = ({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => {
  return (
    <div
      className={cn(
        'glass rounded-2xl p-6 relative overflow-hidden group',
        className
      )}
      {...props}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />
      {children}
    </div>
  );
};
