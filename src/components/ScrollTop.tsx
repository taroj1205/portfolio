'use client'
import React, { useState, useEffect } from "react";
import { Button } from "@nextui-org/react";
import { ArrowUpIcon } from "@heroicons/react/20/solid";

const ScrollToTopButton = () => {
    const [isVisible, setIsVisible] = useState(false);

    const toggleVisibility = () => {
        if (window.scrollY > 500) {
            const footer = document.querySelector("footer") as HTMLElement;
            const footerRect = footer.getBoundingClientRect();
            if (footerRect.top > window.innerHeight) {
                setIsVisible(true);
            } else {
                setIsVisible(false);
            }
        } else {
            setIsVisible(false);
        }
    };

    const scrollToTop = () => {
        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });
    };

    useEffect(() => {
        toggleVisibility();
        window.addEventListener("scroll", toggleVisibility);
        return () => {
            window.removeEventListener("scroll", toggleVisibility);
        };
    }, []);

    return (
        <Button
            className={`fixed z-10 right-4 ${isVisible ? "bottom-4" : "-bottom-12"
                } ${isVisible ? "opacity-100" : "opacity-0"}`}
            color="primary"
            onClick={scrollToTop}
            isIconOnly
        >
            <ArrowUpIcon className="h-7" />
        </Button>
    );
};

export default ScrollToTopButton;