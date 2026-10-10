"use client";

import React, { useState } from "react";
import { cn } from "@/lib/utils";

export interface FaqItem {
  question: string;
  answer: React.ReactNode;
}

export interface FaqAccordionProps extends React.HTMLAttributes<HTMLDivElement> {
  items?: FaqItem[];
  title?: string;
}

export function FaqAccordion({
  items = [],
  title = "",
  className,
  ...props
}: FaqAccordionProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const toggleItem = (index: number) => {
    setActiveIndex(activeIndex === index ? null : index);
  };

  return (
    <div className={cn("w-full max-w-3xl mx-auto py-8 relative font-sans", className)} {...props}>
      {title && (
        <h2 className="text-center font-bold text-2xl md:text-3xl mb-10 text-muted-foreground dark:text-muted-foreground">
          {title}
        </h2>
      )}
      
      <ul className="w-full mx-auto list-none p-0 flex flex-col">
        {items.map((item, index) => {
          const isActive = activeIndex === index;
          return (
            <li
              key={index}
              className={cn(
                "w-full relative transition-all duration-300 ease-in",
                "border-b-2 border-neutral-100 dark:border-neutral-800",
                "last:border-b-0",
                isActive ? "border-b border-neutral-200 dark:border-neutral-700" : ""
              )}
            >
              <button type="button"
                className={cn(
                  "flex flex-row items-center justify-start w-full min-h-[60px] py-4 relative m-0 px-4 pl-14 cursor-pointer",
                  "border-l-[6px] md:border-l-[10px] transition-colors duration-200 text-left outline-none text-base md:text-lg",
                  isActive 
                    ? "border-l-neutral-900 dark:border-l-neutral-100 bg-secondary/50 dark:bg-secondary/30 text-foreground dark:text-foreground font-semibold" 
                    : "border-l-border dark:border-l-border bg-transparent text-muted-foreground dark:text-muted-foreground hover:border-l-muted-foreground dark:hover:border-l-muted-foreground hover:text-foreground dark:hover:text-foreground hover:bg-muted dark:hover:bg-card/50"
                )}
                onClick={() => toggleItem(index)}
                aria-expanded={isActive}
                aria-controls={`faq-answer-${index}`}
              >
                {/* Plus/Minus Icon */}
                <span 
                  className={cn(
                    "absolute left-4 md:left-5 top-1/2 -translate-y-1/2 transition-all duration-200 leading-none",
                    isActive ? "text-[32px] md:text-[40px] font-normal text-foreground dark:text-foreground" : "text-[24px] md:text-[30px] font-normal text-muted-foreground dark:text-muted-foreground"
                  )}
                >
                  {isActive ? "-" : "+"}
                </span>
                
                <span className="pr-8">{item.question}</span>
                
                {/* Chevron */}
                <span 
                  className={cn(
                    "absolute right-6 block w-2 h-2 border-t-[3px] border-r-[3px] transition-transform duration-200 ease-in-out",
                    isActive ? "rotate-[-44deg] border-neutral-900 dark:border-neutral-100" : "rotate-[133deg] border-neutral-400 dark:border-neutral-500"
                  )}
                />
              </button>

              <div id={`faq-answer-${index}`} role="region" aria-hidden={!isActive}
                className={cn(
                  "grid transition-all duration-300 ease-in-out w-full",
                  "border-l-[6px] md:border-l-[10px]",
                  isActive ? "grid-rows-[1fr] border-l-neutral-900 dark:border-l-neutral-100 bg-secondary/50 dark:bg-secondary/30" : "grid-rows-[0fr] border-l-border dark:border-l-border bg-transparent"
                )}
              >
                <div className="overflow-hidden">
                  <div className="flex flex-row items-start justify-start w-full px-4 pl-14 pb-6 pt-2 text-base md:text-lg font-normal text-muted-foreground dark:text-muted-foreground">
                    <span className="opacity-90">{item.answer}</span>
                  </div>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export default FaqAccordion;
