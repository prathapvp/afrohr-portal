

import { Link, useLocation } from "react-router-dom";

type NavLinksProps = {
    links: { name: string; url: string }[];
};

const NavLinks = ({ links }: NavLinksProps) => {
    const location = useLocation();
    return (
        <div className="flex bs-mx:!hidden gap-5 text-mine-shaft-300 h-full items-center">
            {links.map((link, index) => (
                <div
                    key={index}
                    className={`$ {
                        location.pathname === "/" + link.url
                            ? "border-bright-sun-400 text-bright-sun-400"
                            : "border-transparent"
                    } border-t-[3px] h-full flex items-center`}
                >
                    <Link className="hover:text-mine-shaft-200" to={link.url}>
                        {link.name}
                    </Link>
                </div>
            ))}
        </div>
    );
};

export default NavLinks;