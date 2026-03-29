export const TentIcon = ({ className = '', size = 24 }: { className?: string; size?: number }) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
    >
        <path d="M3.5 21h17" />
        <path d="M12 2L3.5 21" />
        <path d="M12 2L20.5 21" />
        <path d="M12 2v19" />
        <path d="M7.5 12L12 2l4.5 10" />
    </svg>
);

export const ResortIcon = ({ className = '', size = 24 }: { className?: string; size?: number }) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
    >
        <path d="M12 3v3" />
        <circle cx="12" cy="12" r="8" />
        <path d="M8 12h8" />
        <path d="M12 8v8" />
        <path d="M16.24 7.76l-1.5 1.5" />
        <path d="M9.26 14.74l-1.5 1.5" />
        <path d="M16.24 16.24l-1.5-1.5" />
        <path d="M9.26 9.26l-1.5-1.5" />
        <path d="M12 21v-1" />
    </svg>
);

export const VillaIcon = ({ className = '', size = 24 }: { className?: string; size?: number }) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
    >
        <path d="M2 20h20" />
        <path d="M7 20v-7l5-5 5 5v7" />
        <path d="M18 12h4v8h-4z" />
        <path d="M2 12h4v8H2z" />
        <path d="M10 20v-4h4v4" />
    </svg>
);
