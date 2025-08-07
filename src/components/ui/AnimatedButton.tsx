'use client';

import Link from "next/link";
import { MouseEventHandler } from "react";

interface AnimatedButtonProps {
  href: string;
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  onMouseEnter?: MouseEventHandler<HTMLAnchorElement>;
  onMouseLeave?: MouseEventHandler<HTMLAnchorElement>;
}

export default function AnimatedButton({ 
  href, 
  children, 
  className = "", 
  style = {},
  onMouseEnter,
  onMouseLeave
}: AnimatedButtonProps) {
  return (
    <Link 
      href={href}
      className={className}
      style={style}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {children}
    </Link>
  );
}