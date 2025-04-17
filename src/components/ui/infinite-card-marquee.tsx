"use client";

import React from "react";
import { cn } from "@/lib/utils";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";

// Define the type for the card items
export type CardItem = {
  id: string | number;
  title?: string;
  description?: string;
  content?: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
  headerClassName?: string;
  contentClassName?: string;
  footerClassName?: string;
};

interface InfiniteCardMarqueeProps {
  cards: CardItem[];
  pauseOnHover?: boolean;
  scaleOnHover?: boolean;
  speed?: "slow" | "normal" | "fast";
  direction?: "left" | "right" | "up" | "down";
  orientation?: "horizontal" | "vertical";
  cardWidth?: number | string;
  cardHeight?: number | string;
  gap?: number;
  className?: string;
  cardClassName?: string;
  containerClassName?: string;
  marqueeClassName?: string;
  cardContentWrapperClassName?: string;
  cardHeaderClassName?: string;
  cardContentClassName?: string;
  cardFooterClassName?: string;
  titleClassName?: string;
  descriptionClassName?: string;
  duplicates?: number; // How many times to duplicate the cards
  autoFill?: boolean; // Automatically add enough duplicates to fill the screen
}

export default function InfiniteCardMarquee({
  cards,
  pauseOnHover = true,
  scaleOnHover = true,
  speed = "normal",
  direction = "left",
  orientation = "horizontal",
  cardWidth = 300,
  cardHeight = "auto",
  gap = 16,
  className = "",
  cardClassName = "",
  containerClassName = "",
  marqueeClassName = "",
  cardContentWrapperClassName = "",
  cardHeaderClassName = "",
  cardContentClassName = "",
  cardFooterClassName = "",
  titleClassName = "",
  descriptionClassName = "",
  duplicates = 2,
  autoFill = false,
}: InfiniteCardMarqueeProps) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = React.useState(0);
  const [containerHeight, setContainerHeight] = React.useState(0);
  const [numDuplicates, setNumDuplicates] = React.useState(duplicates);

  // Normalize direction based on orientation
  const normalizedDirection = React.useMemo(() => {
    if (orientation === "horizontal") {
      return direction === "right" ? "right" : "left";
    } else {
      return direction === "up" ? "up" : "down";
    }
  }, [direction, orientation]);

  // Is vertical orientation
  const isVertical = orientation === "vertical";

  // Calculate number of duplicates needed to fill the container
  React.useEffect(() => {
    if (autoFill && containerRef.current) {
      const calculateDuplicates = () => {
        const containerWidth = containerRef.current?.offsetWidth || 0;
        const containerHeight = containerRef.current?.offsetHeight || 0;

        // Use width for horizontal, height for vertical
        const containerSize = isVertical ? containerHeight : containerWidth;
        const itemSize = isVertical
          ? typeof cardHeight === "number"
            ? cardHeight
            : 300
          : typeof cardWidth === "number"
          ? cardWidth
          : 300;

        const totalItemSize = cards.length * (itemSize + gap);

        // Calculate how many duplicates we need to fill the screen twice (for seamless looping)
        const duplicatesNeeded = Math.max(
          2,
          Math.ceil((containerSize * 2) / totalItemSize)
        );

        setContainerWidth(containerWidth);
        setContainerHeight(containerHeight);
        setNumDuplicates(duplicatesNeeded);
      };

      calculateDuplicates();
      window.addEventListener("resize", calculateDuplicates);
      return () => window.removeEventListener("resize", calculateDuplicates);
    }
  }, [autoFill, cardWidth, cardHeight, gap, cards.length, isVertical]);

  // Determine animation classes based on orientation and direction
  const getAnimationClass = React.useCallback(() => {
    if (orientation === "horizontal") {
      if (direction === "left") {
        switch (speed) {
          case "slow":
            return "animate-marquee-slow";
          case "fast":
            return "animate-marquee-fast";
          default:
            return "animate-marquee";
        }
      } else {
        switch (speed) {
          case "slow":
            return "animate-marquee-slow-reverse";
          case "fast":
            return "animate-marquee-fast-reverse";
          default:
            return "animate-marquee-reverse";
        }
      }
    } else {
      if (direction === "down") {
        switch (speed) {
          case "slow":
            return "animate-marquee-vertical-slow";
          case "fast":
            return "animate-marquee-vertical-fast";
          default:
            return "animate-marquee-vertical";
        }
      } else {
        switch (speed) {
          case "slow":
            return "animate-marquee-vertical-slow-reverse";
          case "fast":
            return "animate-marquee-vertical-fast-reverse";
          default:
            return "animate-marquee-vertical-reverse";
        }
      }
    }
  }, [orientation, direction, speed]);

  // Apply the gap as a CSS variable to the container
  const containerStyle = React.useMemo(
    () =>
      ({
        "--gap": `${gap}px`,
      } as React.CSSProperties),
    [gap]
  );

  // Calculate a fixed height if cardHeight is auto but we want consistency
  const actualCardHeight = React.useMemo(() => {
    if (cardHeight !== "auto") {
      return cardHeight;
    }
    // Default fixed height for auto to maintain consistency
    return isVertical ? 200 : 300; // Slightly shorter for vertical orientation
  }, [cardHeight, isVertical]);

  // Determine correct card size CSS properties
  const cardSizeStyle = React.useMemo(
    () =>
      ({
        width: typeof cardWidth === "number" ? `${cardWidth}px` : cardWidth,
        height:
          typeof actualCardHeight === "number"
            ? `${actualCardHeight}px`
            : actualCardHeight,
        flexShrink: 0,
        flexGrow: 0,
      } as React.CSSProperties),
    [cardWidth, actualCardHeight]
  );

  // Compose Tailwind classes using cn utility
  const rootClasses = cn("w-full overflow-hidden", className);

  const containerClasses = cn(
    "relative w-full",
    isVertical ? "h-[400px]" : "h-auto", // Default height for vertical orientation
    containerClassName
  );

  const marqueeWrapperClasses = cn(
    "flex whitespace-nowrap",
    isVertical ? "flex-col" : "flex-row",
    pauseOnHover ? "hover:[animation-play-state:paused]" : "",
    getAnimationClass()
  );

  const marqueeContentClasses = cn(
    isVertical
      ? "flex flex-col items-center gap-[var(--gap)]"
      : "flex flex-row items-center gap-[var(--gap)]",
    marqueeClassName
  );

  const baseCardClasses = cn(
    "transition-all duration-300 overflow-hidden",
    scaleOnHover ? "hover:scale-105" : "",
    cardClassName
  );

  const contentWrapperClasses = cn(
    "flex flex-col h-full",
    cardContentWrapperClassName
  );

  // Create a template for consistent card rendering
  const renderCard = React.useCallback(
    (card: CardItem, keyPrefix: string, index: number) => (
      <Card
        key={`${keyPrefix}-${card.id}-${index}`}
        className={cn(baseCardClasses, card.className)}
        style={cardSizeStyle}
      >
        <div className={contentWrapperClasses}>
          {(card.title || card.description) && (
            <CardHeader
              className={cn(
                "flex-shrink-0",
                cardHeaderClassName,
                card.headerClassName
              )}
            >
              {card.title && (
                <CardTitle className={cn(titleClassName)}>
                  {card.title}
                </CardTitle>
              )}
              {card.description && (
                <CardDescription className={cn(descriptionClassName)}>
                  {card.description}
                </CardDescription>
              )}
            </CardHeader>
          )}
          {card.content && (
            <CardContent
              className={cn(
                "flex-grow overflow-auto",
                cardContentClassName,
                card.contentClassName
              )}
            >
              <div className="h-full">{card.content}</div>
            </CardContent>
          )}
          {card.footer && (
            <CardFooter
              className={cn(
                "flex-shrink-0 mt-auto",
                cardFooterClassName,
                card.footerClassName
              )}
            >
              {card.footer}
            </CardFooter>
          )}
        </div>
      </Card>
    ),
    [
      baseCardClasses,
      cardSizeStyle,
      contentWrapperClasses,
      cardHeaderClassName,
      cardContentClassName,
      cardFooterClassName,
      titleClassName,
      descriptionClassName,
    ]
  );

  // Create duplicates of the cards for the infinite scroll effect
  const duplicatedCards = React.useMemo(() => {
    const duplicates = [];

    // Generate the duplicated cards
    for (let i = 0; i < numDuplicates; i++) {
      const duplicateSet = cards.map((card, index) =>
        renderCard(card, `dup-${i}`, index)
      );
      duplicates.push(...duplicateSet);
    }

    return duplicates;
  }, [cards, numDuplicates, renderCard]);

  return (
    <div className={rootClasses} style={{ overflow: "hidden" }}>
      <div
        className={containerClasses}
        ref={containerRef}
        style={{ ...containerStyle, overflow: "hidden" }}
      >
        {/* Marquee track */}
        <div
          className={marqueeWrapperClasses}
          style={{ display: "flex", width: "fit-content" }}
        >
          {/* First set of cards */}
          <div className={marqueeContentClasses}>{duplicatedCards}</div>
          {/* Second set of cards (duplicate for seamless loop) */}
          <div className={marqueeContentClasses}>
            {cards.map((card, index) => renderCard(card, "clone", index))}
          </div>
        </div>
      </div>
    </div>
  );
}
