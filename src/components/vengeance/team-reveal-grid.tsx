"use client";

import * as React from "react";
import { useCallback, useEffect, useMemo, useState } from "react";

import { cn } from "@/lib/utils";

export interface TeamRevealMember {
  /** Stable identifier used by the controlled active state. */
  id: string;
  name: string;
  role: string;
  expertise: string;
  /** Any browser-readable image URL. When omitted, an initial-based portrait is rendered. */
  image?: string;
  imageAlt?: string;
  /** CSS object-position value used when an image is supplied. */
  imagePosition?: string;
  /** Accent shown while the member is active. */
  accent?: string;
}

export interface TeamRevealGridProps
  extends Omit<React.ComponentPropsWithoutRef<"section">, "title"> {
  eyebrow?: string;
  title?: string;
  description?: string;
  members?: readonly TeamRevealMember[];
  /** Controlled active member id. */
  activeMemberId?: string | null;
  /** Initial active member id when uncontrolled. Defaults to the first member. */
  defaultActiveMemberId?: string | null;
  onActiveMemberChange?: (memberId: string | null) => void;
  /** Automatically moves the reveal between members when idle. */
  autoPlay?: boolean;
  rotationInterval?: number;
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0))
    .join("")
    .toUpperCase();
}

function Portrait({ member, active }: { member: TeamRevealMember; active: boolean }) {
  const style = {
    "--team-accent": member.accent ?? "hsl(var(--foreground))",
  } as React.CSSProperties;

  return (
    <div
      style={style}
      className={cn(
        "relative h-full overflow-hidden rounded-[1.05rem] bg-secondary transition-colors duration-500 dark:bg-card",
        active && "bg-[color-mix(in_srgb,var(--team-accent)_10%,white)] dark:bg-[color-mix(in_srgb,var(--team-accent)_13%,#0a0a0a)]",
      )}
    >
      <div
        aria-hidden="true"
        className={cn(
          "absolute inset-0 opacity-55 transition-opacity duration-500",
          active && "opacity-100",
        )}
        style={{
          background:
            "radial-gradient(circle at 68% 20%, color-mix(in srgb, var(--team-accent) 36%, transparent), transparent 36%), radial-gradient(circle at 22% 82%, color-mix(in srgb, var(--team-accent) 16%, transparent), transparent 42%)",
        }}
      />

      {member.image ? (
        // A native image keeps the registry component portable across React frameworks.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={member.image}
          alt={member.imageAlt ?? member.name}
          loading="lazy"
          draggable={false}
          className={cn(
            "absolute inset-0 h-full w-full object-cover grayscale transition-[filter,transform,opacity] duration-500 ease-out motion-reduce:transition-none",
            active ? "scale-[1.02] grayscale" : "scale-100 grayscale",
          )}
          style={{ objectPosition: member.imagePosition ?? "center top" }}
        />
      ) : (
        <div className="absolute inset-0 flex flex-col items-center justify-end overflow-hidden">
          <div
            aria-hidden="true"
            className={cn(
              "absolute top-[13%] aspect-square h-[36%] rounded-full bg-muted transition-[transform,background-color] duration-500 dark:bg-muted",
              active && "-translate-y-0.5 scale-105 bg-[var(--team-accent)]",
            )}
          />
          <div
            aria-hidden="true"
            className={cn(
              "absolute -bottom-[12%] h-[66%] w-[82%] rounded-t-[48%] bg-muted/90 transition-[transform,background-color] duration-500 dark:bg-muted/90",
              active && "scale-105 bg-[var(--team-accent)]",
            )}
          />
          <span className="relative z-10 mb-[18%] text-2xl font-semibold tracking-[-0.08em] text-foreground mix-blend-difference">
            {initials(member.name)}
          </span>
        </div>
      )}

      <div
        aria-hidden="true"
        className={cn(
          "pointer-events-none absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/80 via-black/20 to-transparent transition-opacity duration-500",
          active ? "opacity-100" : "opacity-0",
        )}
      />
    </div>
  );
}

export function TeamRevealGrid({
  eyebrow = "The people behind the product",
  title = "Meet the team",
  description = "A small, multidisciplinary team building thoughtful tools for ambitious people.",
  members = [],
  activeMemberId,
  defaultActiveMemberId,
  onActiveMemberChange,
  autoPlay = true,
  rotationInterval = 2800,
  className,
  ...props
}: TeamRevealGridProps) {
  const firstMemberId = members[0]?.id ?? null;
  const [internalActiveId, setInternalActiveId] = useState<string | null>(
    defaultActiveMemberId === undefined ? firstMemberId : defaultActiveMemberId,
  );
  const [interacting, setInteracting] = useState(false);
  const isControlled = activeMemberId !== undefined;

  const memberIds = useMemo(() => new Set(members.map((member) => member.id)), [members]);
  const requestedActiveId = isControlled ? activeMemberId : internalActiveId;
  const resolvedActiveId =
    requestedActiveId && memberIds.has(requestedActiveId) ? requestedActiveId : firstMemberId;

  const selectMember = useCallback(
    (memberId: string | null) => {
      if (!isControlled) setInternalActiveId(memberId);
      onActiveMemberChange?.(memberId);
    },
    [isControlled, onActiveMemberChange],
  );

  useEffect(() => {
    if (!autoPlay || interacting || members.length < 2) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const timer = window.setInterval(() => {
      const currentIndex = members.findIndex((member) => member.id === resolvedActiveId);
      const nextIndex = currentIndex < 0 ? 0 : (currentIndex + 1) % members.length;
      selectMember(members[nextIndex]?.id ?? null);
    }, Math.max(rotationInterval, 1200));

    return () => window.clearInterval(timer);
  }, [autoPlay, interacting, members, resolvedActiveId, rotationInterval, selectMember]);

  return (
    <section
      className={cn(
        "@container relative h-full min-h-[620px] w-full overflow-x-hidden overflow-y-auto bg-foreground px-4 py-10 text-foreground dark:bg-background dark:text-foreground sm:px-7 sm:py-12",
        className,
      )}
      {...props}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.035] dark:opacity-[0.075]"
        style={{
          backgroundImage:
            "radial-gradient(circle at center, currentColor 0.7px, transparent 0.8px)",
          backgroundSize: "12px 12px",
        }}
      />

      <div className="relative mx-auto w-full max-w-5xl">
        <header className="mx-auto mb-8 max-w-2xl text-center">
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground dark:text-muted-foreground">
            {eyebrow}
          </p>
          <h2 className="text-balance text-3xl font-semibold tracking-[-0.045em] sm:text-4xl">
            <span className="relative inline-block">
              <span className="relative z-10">{title}</span>
              <svg
                aria-hidden="true"
                className="absolute -bottom-3 left-0 h-3 w-full text-[hsl(var(--foreground))] sm:-bottom-4 sm:h-4"
                viewBox="0 0 100 20"
                preserveAspectRatio="none"
                fill="none"
              >
                <path d="M2 12 Q35 2 95 10" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" pathLength="1">
                  <animate attributeName="stroke-dasharray" values="0 1;1 0" dur="700ms" fill="freeze" />
                </path>
                <path d="M5 15 Q40 18 98 5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" pathLength="1">
                  <animate attributeName="stroke-dasharray" values="0 1;1 0" dur="800ms" begin="120ms" fill="freeze" />
                </path>
              </svg>
            </span>
          </h2>
          <p className="mx-auto mt-6 max-w-xl text-pretty text-sm leading-6 text-muted-foreground dark:text-muted-foreground">
            {description}
          </p>
        </header>

        <ul className="grid grid-cols-2 gap-x-3 gap-y-6 @min-[560px]:grid-cols-3 @min-[560px]:gap-x-5 @min-[560px]:gap-y-5">
          {members.map((member) => {
            const active = member.id === resolvedActiveId;
            const detailsId = `team-member-${member.id}-details`;

            return (
              <li
                key={member.id}
                className="relative min-h-52 min-w-0 @min-[560px]:min-h-52"
              >
                <button
                  type="button"
                  aria-expanded={active}
                  aria-controls={detailsId}
                  onClick={() => selectMember(member.id)}
                  onPointerEnter={(event) => {
                    if (event.pointerType === "mouse") {
                      setInteracting(true);
                      selectMember(member.id);
                    }
                  }}
                  onPointerLeave={(event) => {
                    if (event.pointerType === "mouse") setInteracting(false);
                  }}
                  onFocus={() => {
                    setInteracting(true);
                    selectMember(member.id);
                  }}
                  onBlur={() => setInteracting(false)}
                  className="group block w-full rounded-[1.35rem] text-left outline-none"
                >
                  <div
                    style={{ "--team-accent": member.accent ?? "hsl(var(--foreground))" } as React.CSSProperties}
                    className={cn(
                      "relative overflow-hidden rounded-[1.35rem] border bg-foreground p-1.5 shadow-premium transition-[border-color,box-shadow,transform] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none dark:bg-card",
                      active
                        ? "-translate-y-1 border-[color-mix(in_srgb,var(--team-accent)_55%,transparent)] shadow-[0_22px_48px_-28px_color-mix(in_srgb,var(--team-accent)_55%,transparent)]"
                        : "border-black/10 dark:border-border",
                      "focus-visible:ring-2 focus-visible:ring-[var(--team-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-neutral-950",
                    )}
                  >
                    <div
                      className={cn(
                        "h-28 transition-[height] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none @min-[560px]:h-32",
                        active && "h-40 @min-[560px]:h-44",
                      )}
                    >
                      <Portrait member={member} active={active} />
                    </div>

                    <div
                      id={detailsId}
                      className={cn(
                        "absolute inset-x-5 bottom-4 z-10 transition-[opacity,transform] duration-500 ease-out motion-reduce:transition-none",
                        active ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0",
                      )}
                    >
                      <p className="line-clamp-3 text-[11px] leading-[1.45] text-foreground/78 @min-[560px]:text-xs">
                        {member.expertise}
                      </p>
                    </div>
                  </div>

                  <div className="px-1.5 pt-3 text-center">
                    <h3 className="truncate text-sm font-semibold tracking-tight @min-[560px]:text-base">
                      {member.name}
                    </h3>
                    <p
                      className={cn(
                        "mt-0.5 truncate text-xs text-muted-foreground transition-colors duration-300 dark:text-muted-foreground",
                        active && "text-[var(--team-accent)] dark:text-[var(--team-accent)]",
                      )}
                      style={{ "--team-accent": member.accent ?? "hsl(var(--foreground))" } as React.CSSProperties}
                    >
                      {member.role}
                    </p>
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}

export default TeamRevealGrid;
