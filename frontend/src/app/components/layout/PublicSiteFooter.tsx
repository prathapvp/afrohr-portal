import { Facebook, Instagram, MessageCircle, Youtube } from "lucide-react";
import { getBrandLogoSrc } from "../../utils/brandLogo";

const socialLinks = [
  {
    label: "Instagram",
    href: "https://www.instagram.com/afro_hr_?igsh=MXYxMDhrMWFlYzZ4bQ==",
    icon: <Instagram className="h-4 w-4" />,
  },
  {
    label: "Facebook",
    href: "https://www.facebook.com/profile.php?id=61569347338452",
    icon: <Facebook className="h-4 w-4" />,
  },
  {
    label: "YouTube",
    href: "https://www.youtube.com/@afrofinancialconsultantsaf1591",
    icon: <Youtube className="h-4 w-4" />,
  },
  {
    label: "WhatsApp",
    href: "https://chat.whatsapp.com/DBx7w0bIl5e8KQ4KqOnfS8?mode=gi_t",
    icon: <MessageCircle className="h-4 w-4" />,
  },
];

export default function PublicSiteFooter() {
  const currentYear = new Date().getFullYear();
  const logoSrc = getBrandLogoSrc();

  return (
    <footer className="border-t border-white/10 px-4 py-8">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          <div className="flex items-center gap-2">
            <img src={logoSrc} alt="AfroHR" className="h-9 w-9 rounded-xl object-contain shadow-[0_10px_30px_rgba(249,115,22,0.25)]" />
            <span className="font-black">
              Afro<span className="text-orange-400">HR</span>
            </span>
          </div>
          <div className="flex items-center gap-3 text-white/60">
            {socialLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={link.label}
                title={link.label}
                className="rounded-full border border-white/15 p-2 transition-colors hover:border-white/35 hover:text-white"
              >
                {link.icon}
              </a>
            ))}
          </div>
          <p className="text-xs text-white/30">© {currentYear} AfroHR · Talent Network</p>
        </div>
      </div>
    </footer>
  );
}
