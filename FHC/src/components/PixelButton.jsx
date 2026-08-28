import { Link } from "react-router-dom";

const VARIANTS = {
  pink: "bg-pink text-ink",
  cream: "bg-cream text-ink",
  dark: "bg-ink text-cream",
  yellow: "bg-arcade text-ink",
  blue: "bg-blue text-ink",
};

const SHADOWS = {
  pink: "#C4106A",
  cream: "#0C0C0F",
  dark: "#FF2E8C",
  yellow: "#BF9F00",
  blue: "#438ABF",
};

const SIZES = {
  md: "text-[13px] px-6 py-4",
  sm: "text-[11px] px-4 py-2.5",
};

export default function PixelButton({
  children,
  onClick,
  href,
  to,
  type,
  variant = "pink",
  size = "md",
  className = "",
  ...rest
}) {
  const classes = `
    font-pixel ${SIZES[size]} ${VARIANTS[variant]}
    border-[3px] border-ink
    shadow-[6px_6px_0_0_${SHADOWS[variant]}]
    transition-transform duration-100
    hover:translate-x-[3px] hover:translate-y-[3px] hover:shadow-[3px_3px_0_0_${SHADOWS[variant]}]
    active:translate-x-[6px] active:translate-y-[6px] active:shadow-none
    inline-flex items-center justify-center gap-2 cursor-pointer select-none
    ${className}
  `;

  if (to) {
    return (
      <Link to={to} className={classes} {...rest}>
        {children}
      </Link>
    );
  }

  if (href) {
    return (
      <a href={href} className={classes} {...rest}>
        {children}
      </a>
    );
  }

  return (
    <button type={type} onClick={onClick} className={classes} {...rest}>
      {children}
    </button>
  );
}
