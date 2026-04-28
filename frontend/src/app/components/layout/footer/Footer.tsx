import { IconBrandFacebook, IconBrandInstagram, IconBrandWhatsapp, IconBrandYoutube } from "@tabler/icons-react";
import { footerLinks } from "../../../data/Data";
import { useLocation } from "react-router";
import { Divider } from "@mantine/core";

const Footer = () => {
    const location = useLocation();

    const socialLinks = [
        {
            href: "https://www.instagram.com/afro_hr_?igsh=MXYxMDhrMWFlYzZ4bQ==",
            label: "Instagram",
            icon: <IconBrandInstagram />,
        },
        {
            href: "https://www.facebook.com/profile.php?id=61569347338452",
            label: "Facebook",
            icon: <IconBrandFacebook />,
        },
        {
            href: "https://www.youtube.com/@afrofinancialconsultantsaf1591",
            label: "YouTube",
            icon: <IconBrandYoutube />,
        },
        {
            href: "https://chat.whatsapp.com/DBx7w0bIl5e8KQ4KqOnfS8?mode=gi_t",
            label: "WhatsApp",
            icon: <IconBrandWhatsapp />,
        },
    ];

    return location.pathname!='/signup' && location.pathname!='/login'?<div className="flex flex-col gap-2"><div className="pt-20 pb-5 bg-mine-shaft-950 p-4  flex gap-8 justify-around flex-wrap">
        <div data-aos="fade-up"  data-aos-offset="0"  className="w-1/4 sm-mx:w-1/3   xs-mx:w-1/2 xsm-mx:w-full flex flex-col gap-4">
            <div className="flex gap-1 items-center text-bright-sun-400">
                <div className="text-xl font-semibold">AfroHR</div>
            </div>
            <div className="text-sm text-mine-shaft-300">AfroHR helps candidates, employers, and students discover opportunities, build profiles, and manage hiring workflows.</div>
            <div className="flex gap-3 text-bright-sun-400 [&>a]:bg-mine-shaft-900 [&>a]:p-2 [&>a]:rounded-full [&>a]:cursor-pointer hover:[&>a]:bg-mine-shaft-700">
                {socialLinks.map((link) => (
                    <a
                        key={link.label}
                        href={link.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={link.label}
                        title={link.label}
                    >
                        {link.icon}
                    </a>
                ))}
            </div>
        </div>
        {
            footerLinks.map((item, index) => <div  data-aos-offset="0"  data-aos="fade-up" key={index}>
                <div className="text-lg font-semibold mb-4 text-bright-sun-400">{item.title}</div>
                {
                    item.links.map((link, index) => <div key={index} className="text-mine-shaft-300 text-sm hover:text-bright-sun-400 cursor-pointer mb-1 hover:translate-x-2 transition duration-300 ease-in-out">{link}</div>)
                }
            </div>)
        }
    </div>
    <Divider/>
    <div data-aos="flip-left"  data-aos-offset="0" className="font-medium text-center p-5">
    &copy; {new Date().getFullYear()} <a className="text-bright-sun-400 hover:underline font-semibold " href="https://afrohr.in">AfroHR</a>
    </div>
    </div>:<></>
}
export default Footer;