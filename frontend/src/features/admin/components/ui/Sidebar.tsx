'use client';

// starc007 / beui.dev Animated Sidebar implementation for ARM Exhaust Admin
// Adapted for Warm Minimalist Craft aesthetic (#fffbf5, #1e1501, #eedec5, #f8a712)

import React, {
  createContext,
  forwardRef,
  useCallback,
  useContext,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type ButtonHTMLAttributes,
  type CSSProperties,
  type HTMLAttributes,
  type ReactNode,
  type Ref,
  type FocusEvent,
  type MouseEvent,
  type ReactElement,
  Children,
  cloneElement,
  isValidElement,
} from 'react';
import {
  AnimatePresence,
  motion,
  useReducedMotion,
  type HTMLMotionProps,
  type Variants,
} from 'framer-motion';
import { ChevronRight, X } from 'lucide-react';
import { cn } from '@/shared/utils/cn';

// --- Motion & Ease Physics Tokens ---
export const EASE_OUT = [0.16, 1, 0.3, 1] as const;
export const EASE_DRAWER = [0.32, 0.72, 0, 1] as const;

export const SPRING_PRESS = {
  type: 'spring',
  stiffness: 500,
  damping: 30,
  mass: 0.6,
} as const;

export const SPRING_LAYOUT = {
  type: 'spring',
  stiffness: 360,
  damping: 32,
  mass: 0.6,
} as const;

export const SIDEBAR_MORPH_TRANSITION = {
  type: 'spring',
  stiffness: 380,
  damping: 35,
  mass: 0.75,
} as const;

export const PANEL_TRANSITION = {
  duration: 0.36,
  ease: EASE_DRAWER,
} as const;

export const LABEL_ENTER_TRANSITION = {
  duration: 0.2,
  delay: 0.08,
  ease: EASE_OUT,
} as const;

export const LABEL_EXIT_TRANSITION = {
  duration: 0.12,
  ease: EASE_OUT,
} as const;

export const SUBMENU_TRANSITION = {
  duration: 0.18,
  ease: EASE_OUT,
} as const;

export const SUBMENU_VARIANTS: Variants = {
  closed: {
    opacity: 0,
    clipPath: 'inset(0 0 100% 0 round 8px)',
    transition: {
      duration: 0.14,
      ease: EASE_OUT,
      staggerChildren: 0.025,
      staggerDirection: -1,
    },
  },
  open: {
    opacity: 1,
    clipPath: 'inset(0 0 0% 0 round 8px)',
    transition: {
      duration: 0.2,
      delayChildren: 0.035,
      ease: EASE_OUT,
      staggerChildren: 0.045,
    },
  },
};

export const SUBMENU_ITEM_VARIANTS: Variants = {
  closed: {
    opacity: 0,
    y: -6,
    filter: 'blur(3px)',
  },
  open: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: SUBMENU_TRANSITION,
  },
};

const REDUCED_TRANSITION = {
  duration: 0.16,
  ease: EASE_OUT,
} as const;

const MOBILE_QUERY = '(max-width: 767px)';
const SIDEBAR_KEYBOARD_SHORTCUT = 'b';
const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  "[tabindex]:not([tabindex='-1'])",
].join(',');

function subscribeToMobileQuery(callback: () => void) {
  if (typeof window === 'undefined') return () => {};
  const query = window.matchMedia(MOBILE_QUERY);
  query.addEventListener('change', callback);
  return () => query.removeEventListener('change', callback);
}

function getMobileSnapshot() {
  if (typeof window === 'undefined') return false;
  return window.matchMedia(MOBILE_QUERY).matches;
}

function getServerMobileSnapshot() {
  return false;
}

function useIsMobile() {
  return useSyncExternalStore(
    subscribeToMobileQuery,
    getMobileSnapshot,
    getServerMobileSnapshot
  );
}

// --- Contexts ---
type SidebarState = 'expanded' | 'collapsed';
type SidebarSide = 'left' | 'right';
type SidebarVariant = 'sidebar' | 'floating' | 'inset';
type SidebarCollapsible = 'offcanvas' | 'icon' | 'none';

interface AnimatedSidebarContextValue {
  isMobile: boolean;
  layoutId: string;
  open: boolean;
  openMobile: boolean;
  reduce: boolean;
  setOpen: (open: boolean) => void;
  setOpenMobile: (open: boolean) => void;
  state: SidebarState;
  toggleSidebar: () => void;
  triggerRef: React.RefObject<HTMLButtonElement | null>;
}

const AnimatedSidebarContext = createContext<AnimatedSidebarContextValue | null>(null);

export function useAnimatedSidebar() {
  const context = useContext(AnimatedSidebarContext);
  if (!context) {
    throw new Error('useAnimatedSidebar must be used inside AnimatedSidebarProvider.');
  }
  return context;
}

// Legacy alias for existing code
export const useSidebar = useAnimatedSidebar;

interface AnimatedSidebarPanelContextValue {
  collapsed: boolean;
  collapsible: SidebarCollapsible;
  side: SidebarSide;
}

const AnimatedSidebarPanelContext = createContext<AnimatedSidebarPanelContextValue | null>(null);

function useAnimatedSidebarPanel() {
  const context = useContext(AnimatedSidebarPanelContext);
  if (!context) {
    throw new Error('Animated Sidebar parts must be used inside AnimatedSidebar.');
  }
  return context;
}

// --- Provider ---
type SidebarProviderStyle = CSSProperties & {
  '--sidebar-width'?: string;
  '--sidebar-width-icon'?: string;
  '--sidebar-width-mobile'?: string;
};

export interface AnimatedSidebarProviderProps extends HTMLAttributes<HTMLDivElement> {
  readonly open?: boolean;
  readonly defaultOpen?: boolean;
  readonly onOpenChange?: (open: boolean) => void;
  readonly openMobile?: boolean;
  readonly defaultOpenMobile?: boolean;
  readonly onOpenMobileChange?: (open: boolean) => void;
  readonly style?: SidebarProviderStyle;
  readonly animate?: boolean;
}

export function AnimatedSidebarProvider({
  children,
  open,
  defaultOpen = true,
  onOpenChange,
  openMobile,
  defaultOpenMobile = false,
  onOpenMobileChange,
  className,
  style,
  ...props
}: Readonly<AnimatedSidebarProviderProps>) {
  const [internalOpen, setInternalOpen] = useState(defaultOpen);
  const [internalOpenMobile, setInternalOpenMobile] = useState(defaultOpenMobile);
  const isMobile = useIsMobile();
  const reduce = useReducedMotion() ?? false;
  const generatedId = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const desktopOpen = open ?? internalOpen;
  const mobileOpen = openMobile ?? internalOpenMobile;

  const setOpen = useCallback(
    (nextOpen: boolean) => {
      if (open === undefined) setInternalOpen(nextOpen);
      onOpenChange?.(nextOpen);
    },
    [onOpenChange, open]
  );

  const setOpenMobile = useCallback(
    (nextOpen: boolean) => {
      if (openMobile === undefined) setInternalOpenMobile(nextOpen);
      onOpenMobileChange?.(nextOpen);
    },
    [onOpenMobileChange, openMobile]
  );

  const toggleSidebar = useCallback(() => {
    if (isMobile) setOpenMobile(!mobileOpen);
    else setOpen(!desktopOpen);
  }, [desktopOpen, isMobile, mobileOpen, setOpen, setOpenMobile]);

  useEffect(() => {
    const handleShortcut = (event: KeyboardEvent) => {
      if (
        event.key.toLowerCase() === SIDEBAR_KEYBOARD_SHORTCUT &&
        (event.metaKey || event.ctrlKey)
      ) {
        event.preventDefault();
        toggleSidebar();
      }
    };

    window.addEventListener('keydown', handleShortcut);
    return () => window.removeEventListener('keydown', handleShortcut);
  }, [toggleSidebar]);

  const contextValue = useMemo(
    () => ({
      isMobile,
      layoutId: `${generatedId}-active`,
      open: desktopOpen,
      openMobile: mobileOpen,
      reduce,
      setOpen,
      setOpenMobile,
      state: desktopOpen ? ('expanded' as const) : ('collapsed' as const),
      toggleSidebar,
      triggerRef,
    }),
    [
      desktopOpen,
      generatedId,
      isMobile,
      mobileOpen,
      reduce,
      setOpen,
      setOpenMobile,
      toggleSidebar,
      triggerRef,
    ]
  );

  return (
    <AnimatedSidebarContext.Provider value={contextValue}>
      <div
        {...props}
        data-slot="sidebar-wrapper"
        data-state={desktopOpen ? 'expanded' : 'collapsed'}
        style={{
          '--sidebar-width': '15.5rem',
          '--sidebar-width-icon': '4.25rem',
          '--sidebar-width-mobile': '18rem',
          ...style,
        }}
        className={cn(
          'group/sidebar-wrapper flex min-h-screen w-full min-w-0 select-none font-geist',
          className
        )}
      >
        {children}
      </div>
    </AnimatedSidebarContext.Provider>
  );
}

// Legacy alias
export const SidebarProvider = AnimatedSidebarProvider;

// --- Shared Layout Hover Highlight (Pill Spring) ---
export interface SharedLayoutBgProps extends Omit<HTMLAttributes<HTMLElement>, 'children'> {
  children: ReactNode;
  as?: 'div' | 'ul';
  pillClassName?: string;
  inset?: number;
  pillContainerClassName?: string;
}

const sharedBgVariants: Variants = {
  initial: { opacity: 0, filter: 'blur(4px)' },
  animate: { opacity: 1, filter: 'blur(0px)' },
  exit: (isActive: boolean) => (!isActive ? { opacity: 0, filter: 'blur(4px)' } : {}),
};

const sharedBgReducedVariants: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: (isActive: boolean) => (!isActive ? { opacity: 0 } : {}),
};

export const SharedLayoutBg = forwardRef<HTMLElement, SharedLayoutBgProps>(
  function SharedLayoutBg(
    {
      children,
      as = 'div',
      className,
      onMouseLeave,
      onBlur,
      pillClassName,
      pillContainerClassName,
      inset = 0,
      ...props
    },
    forwardedRef
  ) {
    const [activeId, setActiveId] = useState<string | null>(null);
    const uid = useId();
    const reduce = useReducedMotion();
    const hovering = useRef(false);

    const renderedChildren = Children.toArray(children)
      .filter(isValidElement)
      .map((child, index) => {
        const el = child as ReactElement<{
          className?: string;
          onMouseEnter?: () => void;
          onFocus?: (event: FocusEvent<HTMLElement>) => void;
          children?: ReactNode;
        }>;
        const childKey = el.key ? String(el.key) : `item-${index}`;
        return cloneElement(
          el,
          {
            key: childKey,
            className: cn('relative', el.props.className),
            onMouseEnter: () => {
              el.props.onMouseEnter?.();
              hovering.current = true;
              setActiveId(childKey);
            },
            onFocus: (event: FocusEvent<HTMLElement>) => {
              el.props.onFocus?.(event);
              setActiveId(childKey);
            },
          },
          <>
            <AnimatePresence custom={activeId !== null}>
              {activeId !== null ? (
                <motion.div
                  variants={reduce ? sharedBgReducedVariants : sharedBgVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  custom={activeId !== null}
                  className={cn(
                    'pointer-events-none absolute inset-y-0 z-0',
                    pillContainerClassName
                  )}
                  style={{ left: -inset, right: -inset }}
                >
                  {activeId === childKey ? (
                    <motion.div
                      layoutId={`shared-bg-${uid}`}
                      transition={reduce ? { duration: 0 } : SPRING_LAYOUT}
                      className={cn(
                        'pointer-events-none h-full w-full rounded-xl bg-white/[0.07] border border-white/[0.04]',
                        pillClassName
                      )}
                    />
                  ) : null}
                </motion.div>
              ) : null}
            </AnimatePresence>
            <div className="relative z-10 w-full">{el.props.children}</div>
          </>
        );
      });

    const handleMouseLeave = (event: MouseEvent<HTMLElement>) => {
      hovering.current = false;
      if (!event.currentTarget.contains(document.activeElement)) setActiveId(null);
      onMouseLeave?.(event);
    };

    const handleBlur = (event: FocusEvent<HTMLElement>) => {
      const next = event.relatedTarget;
      if (!hovering.current && !(next instanceof Node && event.currentTarget.contains(next))) {
        setActiveId(null);
      }
      onBlur?.(event);
    };

    return as === 'ul' ? (
      <motion.ul
        {...(props as HTMLMotionProps<'ul'>)}
        ref={forwardedRef as Ref<HTMLUListElement>}
        layoutRoot
        onMouseLeave={handleMouseLeave}
        onBlur={handleBlur}
        className={cn('flex w-full flex-col', className)}
      >
        {renderedChildren}
      </motion.ul>
    ) : (
      <motion.div
        {...(props as HTMLMotionProps<'div'>)}
        ref={forwardedRef as Ref<HTMLDivElement>}
        layoutRoot
        onMouseLeave={handleMouseLeave}
        onBlur={handleBlur}
        className={cn('flex w-full flex-col', className)}
      >
        {renderedChildren}
      </motion.div>
    );
  }
);

// --- Mobile Sheet Component ---
interface MobileSidebarProps {
  readonly ariaLabel: string;
  readonly children: ReactNode;
  readonly className?: string;
  readonly side: SidebarSide;
}

function useMobileBodyLock(
  isOpen: boolean,
  panelRef: React.RefObject<HTMLDivElement | null>,
  triggerRef?: React.RefObject<HTMLElement | null>
) {
  useEffect(() => {
    if (!isOpen) return;

    const body = document.body;
    const scrollY = window.scrollY;
    const previousBodyStyles = {
      left: body.style.left,
      overflow: body.style.overflow,
      position: body.style.position,
      right: body.style.right,
      top: body.style.top,
    };

    body.style.position = 'fixed';
    body.style.top = `-${scrollY}px`;
    body.style.left = '0';
    body.style.right = '0';
    body.style.overflow = 'hidden';

    const focusFrame = requestAnimationFrame(() => {
      const firstFocusable = panelRef.current?.querySelector<HTMLElement>(FOCUSABLE_SELECTOR);
      (firstFocusable ?? panelRef.current)?.focus({ preventScroll: true });
    });

    return () => {
      cancelAnimationFrame(focusFrame);
      body.style.position = previousBodyStyles.position;
      body.style.top = previousBodyStyles.top;
      body.style.left = previousBodyStyles.left;
      body.style.right = previousBodyStyles.right;
      body.style.overflow = previousBodyStyles.overflow;
      window.scrollTo(0, scrollY);
      triggerRef?.current?.focus({ preventScroll: true });
    };
  }, [isOpen, panelRef, triggerRef]);
}

function getMobilePanelAnimation(open: boolean, reduce: boolean, side: SidebarSide) {
  if (reduce) {
    return {
      opacity: open ? 1 : 0,
      x: 0,
    };
  }

  if (open) {
    return {
      opacity: 1,
      x: '0%',
    };
  }

  return {
    opacity: 1,
    x: side === 'left' ? '-100%' : '100%',
  };
}

function MobileSidebar({
  ariaLabel,
  children,
  className,
  side,
}: Readonly<MobileSidebarProps>) {
  const context = useAnimatedSidebar();
  const panelRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);
  const [hidden, setHidden] = useState(!context.openMobile);
  const openMobileRef = useRef(context.openMobile);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    openMobileRef.current = context.openMobile;
    if (context.openMobile) setHidden(false);
  }, [context.openMobile]);

  useMobileBodyLock(context.openMobile, panelRef, context.triggerRef);

  if (!mounted) return null;

  const panelAnimation = getMobilePanelAnimation(context.openMobile, context.reduce, side);
  const panelTransition = context.reduce ? REDUCED_TRANSITION : PANEL_TRANSITION;
  const panelContextValue = useMemo(
    () => ({ collapsed: false, collapsible: 'none' as const, side }),
    [side]
  );

  return (
    <div
      className={cn(
        'pointer-events-none fixed left-0 top-0 z-50 size-0 md:hidden',
        hidden && !context.openMobile ? 'invisible' : 'visible'
      )}
    >
      <motion.button
        type="button"
        aria-label="Tutup sidebar"
        tabIndex={context.openMobile ? 0 : -1}
        initial={false}
        animate={{ opacity: context.openMobile ? 1 : 0 }}
        transition={panelTransition}
        onClick={() => context.setOpenMobile(false)}
        className={cn(
          'fixed inset-0 bg-black/50 backdrop-blur-xs',
          context.openMobile ? 'pointer-events-auto' : 'pointer-events-none'
        )}
      />

      <motion.div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={ariaLabel}
        aria-hidden={!context.openMobile}
        inert={!context.openMobile}
        tabIndex={-1}
        data-mobile="true"
        data-state={context.openMobile ? 'expanded' : 'collapsed'}
        data-side={side}
        initial={false}
        animate={panelAnimation}
        transition={panelTransition}
        onAnimationComplete={() => {
          if (!openMobileRef.current) setHidden(true);
        }}
        onKeyDown={(event) => {
          if (event.key === 'Escape') {
            event.preventDefault();
            context.setOpenMobile(false);
          }
        }}
        className={cn(
          'pointer-events-auto fixed inset-y-0 flex h-dvh w-[var(--sidebar-width-mobile)] max-w-[85vw] flex-col overflow-hidden',
          'border-r border-[#27272a] bg-[#09090b] shadow-2xl will-change-transform text-white font-geist',
          side === 'left' ? 'left-0' : 'right-0 border-l border-r-0',
          !context.openMobile && 'pointer-events-none',
          className
        )}
      >
        <AnimatedSidebarPanelContext.Provider value={panelContextValue}>
          <div className="relative flex flex-col h-full w-full">
            <button
              type="button"
              onClick={() => context.setOpenMobile(false)}
              className="absolute top-3 right-3 z-30 p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
              aria-label="Tutup sidebar"
              title="Tutup sidebar"
            >
              <X className="h-4 w-4" />
            </button>
            {children}
          </div>
        </AnimatedSidebarPanelContext.Provider>
      </motion.div>
    </div>
  );
}

// --- Main AnimatedSidebar Component ---
function getSidebarWidth(offcanvas: boolean, collapsed: boolean): string {
  if (offcanvas) return '0px';
  if (collapsed) return 'var(--sidebar-width-icon)';
  return 'var(--sidebar-width)';
}

function getPanelMotion(offcanvas: boolean, side: SidebarSide) {
  if (!offcanvas) {
    return { opacity: 1, x: '0%' };
  }
  return {
    opacity: 0,
    x: side === 'left' ? '-100%' : '100%',
  };
}

function getPanelVariantClass(
  variant: SidebarVariant,
  side: SidebarSide,
  collapsible: SidebarCollapsible,
  panelClassName?: string
): string {
  return cn(
    'sticky top-0 flex h-screen w-full flex-col overflow-hidden bg-[#09090b] text-white font-geist',
    collapsible === 'offcanvas' && 'w-[var(--sidebar-width)]',
    variant === 'sidebar' &&
      (side === 'left' ? 'border-r border-[#27272a]' : 'border-l border-[#27272a]'),
    variant === 'floating' &&
      'm-2.5 h-[calc(100vh-1.25rem)] rounded-2xl border border-[#27272a] bg-[#09090b] shadow-sm',
    variant === 'inset' && 'm-2.5 h-[calc(100vh-1.25rem)] rounded-2xl',
    panelClassName
  );
}

export interface AnimatedSidebarProps extends Omit<HTMLMotionProps<'aside'>, 'children'> {
  readonly children?: ReactNode;
  readonly side?: SidebarSide;
  readonly variant?: SidebarVariant;
  readonly collapsible?: SidebarCollapsible;
  readonly ariaLabel?: string;
  readonly panelClassName?: string;
  readonly open?: boolean;
  readonly setOpen?: React.Dispatch<React.SetStateAction<boolean>>;
  readonly animate?: boolean;
}

export const AnimatedSidebar = forwardRef<HTMLElement, AnimatedSidebarProps>(
  function AnimatedSidebar(
    {
      side = 'left',
      variant = 'sidebar',
      collapsible = 'icon',
      ariaLabel = 'Sidebar Admin ARM Exhaust',
      children,
      className,
      panelClassName,
      style,
      ...props
    }: Readonly<AnimatedSidebarProps>,
    forwardedRef
  ) {
    const context = useAnimatedSidebar();
    const collapsed = collapsible !== 'none' && !context.open;
    const offcanvas = collapsed && collapsible === 'offcanvas';
    const width = getSidebarWidth(offcanvas, collapsed);
    const panelMotion = getPanelMotion(offcanvas, side);
    const panelClasses = getPanelVariantClass(variant, side, collapsible, panelClassName);

    const panelContextValue = useMemo(
      () => ({ collapsed, collapsible, side }),
      [collapsed, collapsible, side]
    );

    if (context.isMobile) {
      return (
        <MobileSidebar ariaLabel={ariaLabel} className={className} side={side}>
          {children}
        </MobileSidebar>
      );
    }

    return (
      <motion.aside
        {...props}
        ref={forwardedRef}
        initial={false}
        aria-label={ariaLabel}
        data-slot="sidebar"
        data-state={collapsed ? 'collapsed' : 'expanded'}
        data-collapsible={collapsible}
        data-variant={variant}
        data-side={side}
        animate={{ width }}
        transition={context.reduce ? { duration: 0 } : SIDEBAR_MORPH_TRANSITION}
        style={style}
        className={cn(
          'group/sidebar relative hidden h-auto shrink-0 md:block will-change-[width] peer select-none',
          side === 'right' && 'order-last',
          className
        )}
      >
        <AnimatedSidebarPanelContext.Provider value={panelContextValue}>
          <motion.div
            initial={false}
            animate={panelMotion}
            transition={context.reduce ? REDUCED_TRANSITION : PANEL_TRANSITION}
            className={panelClasses}
          >
            {children}
          </motion.div>
          {collapsible !== 'none' && <AnimatedSidebarRail />}
        </AnimatedSidebarPanelContext.Provider>
      </motion.aside>
    );
  }
);

// Legacy alias
export const Sidebar = AnimatedSidebar;

// --- Sidebar Trigger Button ---
export interface AnimatedSidebarTriggerProps extends ButtonHTMLAttributes<HTMLButtonElement> {}

export const AnimatedSidebarTrigger = forwardRef<HTMLButtonElement, AnimatedSidebarTriggerProps>(
  function AnimatedSidebarTrigger(
    { className, onClick, type = 'button', ...props },
    forwardedRef
  ) {
    const context = useAnimatedSidebar();
    const expanded = context.isMobile ? context.openMobile : context.open;

    return (
      <button
        {...props}
        ref={(node) => {
          context.triggerRef.current = node;
          if (typeof forwardedRef === 'function') forwardedRef(node);
          else if (forwardedRef) forwardedRef.current = node;
        }}
        type={type}
        aria-label={props['aria-label'] ?? 'Alihkan sidebar (Ctrl+B)'}
        aria-expanded={expanded}
        data-slot="sidebar-trigger"
        data-state={expanded ? 'expanded' : 'collapsed'}
        onClick={(event) => {
          onClick?.(event);
          if (!event.defaultPrevented) context.toggleSidebar();
        }}
        className={cn(
          'inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[#27272a] bg-[#18181b] text-zinc-400 hover:text-white hover:bg-zinc-800 transition shadow-xs outline-none',
          className
        )}
      />
    );
  }
);

// --- Sidebar Rail for mouse-hover toggle affordance ---
export const AnimatedSidebarRail = forwardRef<
  HTMLButtonElement,
  ButtonHTMLAttributes<HTMLButtonElement>
>(function AnimatedSidebarRail({ className, onClick, type = 'button', ...props }, forwardedRef) {
  const context = useAnimatedSidebar();
  const panel = useAnimatedSidebarPanel();

  return (
    <button
      {...props}
      ref={forwardedRef}
      type={type}
      data-side={panel.side}
      aria-label={props['aria-label'] ?? 'Alihkan sidebar'}
      title="Alihkan sidebar (Ctrl+B)"
      tabIndex={-1}
      onClick={(event) => {
        onClick?.(event);
        if (!event.defaultPrevented) context.toggleSidebar();
      }}
      className={cn(
        'absolute inset-y-0 z-20 hidden w-3 -translate-x-1/2 outline-none md:block group-hover/sidebar:cursor-col-resize',
        'after:absolute after:inset-y-0 after:left-1/2 after:w-0.5 after:bg-transparent after:transition-colors hover:after:bg-zinc-500/80',
        'data-[side=right]:right-0 data-[side=right]:translate-x-1/2 data-[side=left]:left-full',
        className
      )}
    />
  );
});

// --- Structural Blocks: Header, Content, Footer ---
export const AnimatedSidebarHeader = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  function AnimatedSidebarHeader({ className, ...props }, forwardedRef) {
    return (
      <div
        {...props}
        ref={forwardedRef}
        data-slot="sidebar-header"
        className={cn('flex shrink-0 flex-col gap-2 p-3 pb-2 border-b border-[#27272a]', className)}
      />
    );
  }
);

export const AnimatedSidebarContent = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  function AnimatedSidebarContent({ className, ...props }, forwardedRef) {
    return (
      <div
        {...props}
        ref={forwardedRef}
        data-slot="sidebar-content"
        className={cn(
          'flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto overflow-x-hidden scrollbar-none px-2 py-3',
          className
        )}
      />
    );
  }
);

export const AnimatedSidebarFooter = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  function AnimatedSidebarFooter({ className, ...props }, forwardedRef) {
    return (
      <div
        {...props}
        ref={forwardedRef}
        data-slot="sidebar-footer"
        className={cn(
          'flex shrink-0 flex-col gap-2 border-t border-[#27272a] p-3',
          className
        )}
      />
    );
  }
);

// Legacy alias
export const SidebarBody = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  function SidebarBody({ className, children, ...props }, ref) {
    return (
      <div ref={ref} className={cn('flex flex-col justify-between h-full w-full', className)} {...props}>
        {children}
      </div>
    );
  }
);

// --- Grouping Blocks ---
export const AnimatedSidebarGroup = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  function AnimatedSidebarGroup({ className, ...props }, forwardedRef) {
    return (
      <div
        {...props}
        ref={forwardedRef}
        data-slot="sidebar-group"
        className={cn('flex w-full min-w-0 flex-col px-1 py-1', className)}
      />
    );
  }
);

export const AnimatedSidebarGroupLabel = forwardRef<
  HTMLDivElement,
  HTMLAttributes<HTMLDivElement>
>(function AnimatedSidebarGroupLabel({ children, className, ...props }, forwardedRef) {
  const { collapsed } = useAnimatedSidebarPanel();

  return (
    <div
      {...props}
      ref={forwardedRef}
      aria-hidden={collapsed}
      data-slot="sidebar-group-label"
      className={cn(
        'mb-1 h-6 overflow-hidden px-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-500 transition-opacity',
        collapsed ? 'opacity-0 h-0 my-0' : 'opacity-100',
        className
      )}
    >
      {children}
    </div>
  );
});

export const AnimatedSidebarGroupContent = forwardRef<
  HTMLDivElement,
  HTMLAttributes<HTMLDivElement>
>(function AnimatedSidebarGroupContent({ className, ...props }, forwardedRef) {
  return (
    <div
      {...props}
      ref={forwardedRef}
      data-slot="sidebar-group-content"
      className={cn('w-full min-w-0', className)}
    />
  );
});

// --- Menu Lists & Items ---
export const AnimatedSidebarMenu = forwardRef<
  HTMLUListElement,
  HTMLAttributes<HTMLUListElement>
>(function AnimatedSidebarMenu({ children, className, ...props }, forwardedRef) {
  return (
    <SharedLayoutBg
      {...props}
      ref={forwardedRef as React.Ref<HTMLElement>}
      as="ul"
      inset={0}
      pillClassName="rounded-xl bg-white/[0.07] border border-white/[0.04]"
      pillContainerClassName="inset-y-auto top-0 h-9"
      data-slot="sidebar-menu"
      className={cn('flex w-full min-w-0 list-none flex-col gap-1', className)}
    >
      {children}
    </SharedLayoutBg>
  );
});

export const AnimatedSidebarMenuItem = forwardRef<HTMLLIElement, HTMLMotionProps<'li'>>(
  function AnimatedSidebarMenuItem({ className, ...props }, forwardedRef) {
    return (
      <motion.li
        {...props}
        ref={forwardedRef}
        layout="position"
        transition={SPRING_LAYOUT}
        data-slot="sidebar-menu-item"
        className={cn('relative', className)}
      />
    );
  }
);

// --- Interactive Menu Button with Active Morphing Pill ---
export interface AnimatedSidebarMenuButtonProps {
  readonly children: ReactNode;
  readonly icon?: ReactNode;
  readonly badge?: ReactNode;
  readonly href?: string;
  readonly isActive?: boolean;
  readonly ariaExpanded?: boolean;
  readonly disabled?: boolean;
  readonly closeOnSelect?: boolean;
  readonly target?: '_blank' | '_self' | '_parent' | '_top';
  readonly rel?: string;
  readonly onSelect?: () => void;
  readonly className?: string;
}

function getLabelTransition(reduce: boolean, collapsed: boolean) {
  if (reduce) return REDUCED_TRANSITION;
  if (collapsed) return LABEL_EXIT_TRANSITION;
  return LABEL_ENTER_TRANSITION;
}

function getBadgeText(badge?: ReactNode): string {
  if (typeof badge === 'string' || typeof badge === 'number') {
    return String(badge);
  }
  return '';
}

function MenuButtonTooltip({
  textLabel,
  badgeText,
}: {
  readonly textLabel: string;
  readonly badgeText: string;
}) {
  return (
    <span className="pointer-events-none absolute left-full top-1/2 -translate-y-1/2 ml-2.5 z-50 hidden rounded-md bg-zinc-900 border border-zinc-800 px-2 py-1 text-[11px] font-medium text-zinc-200 shadow-xl group-hover:block whitespace-nowrap">
      {textLabel}
      {badgeText ? ` (${badgeText})` : ''}
    </span>
  );
}

function MenuButtonContent({
  children,
  icon,
  badge,
  badgeText,
  isActive,
  ariaExpanded,
  collapsed,
  reduce,
  layoutId,
  textLabel,
}: {
  readonly children: ReactNode;
  readonly icon?: ReactNode;
  readonly badge?: ReactNode;
  readonly badgeText: string;
  readonly isActive: boolean;
  readonly ariaExpanded?: boolean;
  readonly collapsed: boolean;
  readonly reduce: boolean;
  readonly layoutId: string;
  readonly textLabel?: string;
}) {
  const labelTransition = getLabelTransition(reduce, collapsed);

  return (
    <>
      {isActive && (
        <motion.span
          layoutId={layoutId}
          transition={reduce ? { duration: 0 } : SPRING_LAYOUT}
          className="absolute inset-0 rounded-xl bg-white/[0.08] border border-white/[0.08] shadow-xs"
        />
      )}

      {icon && (
        <span
          aria-hidden="true"
          className={cn(
            'relative z-10 grid size-5 shrink-0 place-items-center transition-colors',
            isActive ? 'text-white' : 'text-zinc-400 group-hover:text-zinc-100'
          )}
        >
          {icon}
        </span>
      )}

      <motion.span
        initial={false}
        animate={{
          opacity: collapsed ? 0 : 1,
          x: collapsed ? -4 : 0,
        }}
        transition={labelTransition}
        aria-hidden={collapsed}
        className={cn(
          'relative z-10 min-w-0 flex-1 truncate text-xs font-medium text-left',
          collapsed && 'pointer-events-none'
        )}
      >
        {children}
      </motion.span>

      {badge && !collapsed && (
        <span
          className={cn(
            'relative z-10 shrink-0 rounded px-1.5 py-0.5 font-mono text-[10px] font-bold',
            isActive
              ? 'bg-zinc-800 border border-zinc-700 text-zinc-200'
              : 'bg-zinc-900 border border-zinc-800 text-zinc-400'
          )}
        >
          {badge}
        </span>
      )}

      {ariaExpanded !== undefined && (
        <motion.span
          aria-hidden="true"
          initial={false}
          animate={{
            opacity: collapsed ? 0 : 1,
            rotate: ariaExpanded ? 90 : 0,
            x: collapsed ? 4 : 0,
          }}
          transition={reduce ? { duration: 0 } : SPRING_LAYOUT}
          className="relative z-10 grid size-4 shrink-0 place-items-center text-zinc-500"
        >
          <ChevronRight className="size-3.5" />
        </motion.span>
      )}

      {collapsed && textLabel && (
        <MenuButtonTooltip textLabel={textLabel} badgeText={badgeText} />
      )}
    </>
  );
}

export function AnimatedSidebarMenuButton({
  children,
  icon,
  badge,
  href,
  isActive = false,
  ariaExpanded,
  disabled = false,
  closeOnSelect,
  target,
  rel,
  onSelect,
  className,
}: Readonly<AnimatedSidebarMenuButtonProps>) {
  const context = useAnimatedSidebar();
  const panel = useAnimatedSidebarPanel();
  const textLabel = typeof children === 'string' ? children : undefined;
  const badgeText = getBadgeText(badge);

  const select = (event: React.MouseEvent<HTMLAnchorElement | HTMLButtonElement>) => {
    if (disabled) {
      event.preventDefault();
      return;
    }
    onSelect?.();
    const shouldCloseOnSelect = closeOnSelect ?? ariaExpanded === undefined;
    if (context.isMobile && shouldCloseOnSelect) {
      context.setOpenMobile(false);
    }
    if (ariaExpanded !== undefined && panel.collapsed && !context.isMobile) {
      context.setOpen(true);
    }
  };

  const interactiveClassName = cn(
    'group relative flex min-h-9 w-full min-w-0 items-center gap-2.5 rounded-xl px-3 text-left text-xs font-medium outline-none transition-colors',
    panel.collapsed ? 'overflow-visible' : 'overflow-hidden',
    'text-zinc-400 hover:text-white',
    isActive && 'text-white font-medium',
    disabled && 'cursor-not-allowed opacity-40',
    className
  );

  const commonProps = {
    'aria-current': isActive ? ('page' as const) : undefined,
    'aria-expanded': ariaExpanded,
    'aria-label': panel.collapsed ? textLabel : undefined,
    title: panel.collapsed ? textLabel : undefined,
    onClick: select,
    whileTap: context.reduce || disabled ? undefined : { scale: 0.98 },
    transition: SPRING_PRESS,
    className: interactiveClassName,
  };

  const content = (
    <MenuButtonContent
      badge={badge}
      badgeText={badgeText}
      collapsed={panel.collapsed}
      icon={icon}
      isActive={isActive}
      layoutId={context.layoutId}
      reduce={context.reduce}
      textLabel={textLabel}
      ariaExpanded={ariaExpanded}
    >
      {children}
    </MenuButtonContent>
  );

  if (href) {
    return (
      <motion.a
        href={href}
        target={target}
        rel={rel ?? (target === '_blank' ? 'noreferrer noopener' : undefined)}
        aria-disabled={disabled || undefined}
        tabIndex={disabled ? -1 : undefined}
        {...commonProps}
      >
        {content}
      </motion.a>
    );
  }

  return (
    <motion.button type="button" disabled={disabled} {...commonProps}>
      {content}
    </motion.button>
  );
}

// Legacy alias
export const SidebarLink = ({
  link,
  isActive = false,
  onClick,
  className,
}: {
  link: {
    label: string;
    href?: string;
    icon: ReactNode;
    badge?: string;
  };
  isActive?: boolean;
  onClick?: () => void;
  className?: string;
}) => {
  return (
    <AnimatedSidebarMenuItem>
      <AnimatedSidebarMenuButton
        icon={link.icon}
        badge={link.badge}
        isActive={isActive}
        onSelect={onClick}
        href={link.href}
        className={className}
      >
        {link.label}
      </AnimatedSidebarMenuButton>
    </AnimatedSidebarMenuItem>
  );
};

// --- Sub-menu Navigation ---
export interface AnimatedSidebarMenuSubProps extends Omit<HTMLMotionProps<'ul'>, 'children'> {
  open: boolean;
  children?: ReactNode;
}

export const AnimatedSidebarMenuSub = forwardRef<
  HTMLUListElement,
  AnimatedSidebarMenuSubProps
>(function AnimatedSidebarMenuSub({ open, children, className, ...props }, forwardedRef) {
  const context = useAnimatedSidebar();
  const panel = useAnimatedSidebarPanel();

  return (
    <AnimatePresence initial={false} mode="popLayout">
      {open && !panel.collapsed ? (
        <motion.ul
          {...props}
          ref={forwardedRef}
          key="sidebar-submenu"
          variants={context.reduce ? undefined : SUBMENU_VARIANTS}
          initial={context.reduce ? false : 'closed'}
          animate={context.reduce ? { opacity: 1 } : 'open'}
          exit={context.reduce ? { opacity: 0 } : 'closed'}
          transition={context.reduce ? { duration: 0.12 } : undefined}
          data-slot="sidebar-menu-sub"
          className={cn(
            'relative mt-1 ml-5 flex min-w-0 flex-col gap-0.5 border-l border-[#27272a] pl-3',
            className
          )}
        >
          {children}
        </motion.ul>
      ) : null}
    </AnimatePresence>
  );
});

export const AnimatedSidebarMenuSubItem = forwardRef<HTMLLIElement, HTMLMotionProps<'li'>>(
  function AnimatedSidebarMenuSubItem({ className, ...props }, forwardedRef) {
    return (
      <motion.li
        {...props}
        ref={forwardedRef}
        variants={SUBMENU_ITEM_VARIANTS}
        data-slot="sidebar-menu-sub-item"
        className={cn('relative min-w-0', className)}
      />
    );
  }
);

export interface AnimatedSidebarMenuSubButtonProps {
  children: ReactNode;
  icon?: ReactNode;
  href?: string;
  isActive?: boolean;
  disabled?: boolean;
  closeOnSelect?: boolean;
  target?: '_blank' | '_self' | '_parent' | '_top';
  rel?: string;
  onSelect?: () => void;
  className?: string;
}

export function AnimatedSidebarMenuSubButton({
  children,
  icon,
  href,
  isActive = false,
  disabled = false,
  closeOnSelect = true,
  target,
  rel,
  onSelect,
  className,
}: AnimatedSidebarMenuSubButtonProps) {
  const context = useAnimatedSidebar();

  const select = (event: React.MouseEvent<HTMLAnchorElement | HTMLButtonElement>) => {
    if (disabled) {
      event.preventDefault();
      return;
    }
    onSelect?.();
    if (context.isMobile && closeOnSelect) context.setOpenMobile(false);
  };

  const content = (
    <>
      <span aria-hidden="true" className="grid size-4 shrink-0 place-items-center">
        {icon ?? <span className="size-1 rounded-full bg-current" />}
      </span>
      <span className="min-w-0 flex-1 truncate">{children}</span>
    </>
  );

  const interactiveClassName = cn(
    'flex min-h-8 w-full min-w-0 items-center gap-2 rounded-md px-2 text-left text-xs outline-none',
    'text-zinc-400 transition-colors hover:bg-white/[0.06] hover:text-white',
    isActive && 'bg-white/10 text-white font-medium',
    disabled && 'cursor-not-allowed opacity-40',
    className
  );

  return href ? (
    <motion.a
      href={href}
      target={target}
      rel={rel ?? (target === '_blank' ? 'noreferrer noopener' : undefined)}
      aria-current={isActive ? 'page' : undefined}
      aria-disabled={disabled || undefined}
      tabIndex={disabled ? -1 : undefined}
      onClick={select}
      whileTap={context.reduce || disabled ? undefined : { scale: 0.98 }}
      transition={SPRING_PRESS}
      className={interactiveClassName}
    >
      {content}
    </motion.a>
  ) : (
    <motion.button
      type="button"
      disabled={disabled}
      aria-current={isActive ? 'page' : undefined}
      onClick={select}
      whileTap={context.reduce || disabled ? undefined : { scale: 0.98 }}
      transition={SPRING_PRESS}
      className={interactiveClassName}
    >
      {content}
    </motion.button>
  );
}
