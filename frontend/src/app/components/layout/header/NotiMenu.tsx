import { Indicator, Menu, Notification, rem } from "@mantine/core";
import { IconBell, IconCheck } from "@tabler/icons-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { getMyNotifications, readNotification } from "../../../services/notification-service";
import { useAppSelector } from "../../../store";

type NotificationUser = {
    id?: number;
} | null;

type NotificationItem = {
    id: number;
    action: string;
    message: string;
    route: string;
};

const NotiMenu = () => {
    const navigate=useNavigate();
    const user = useAppSelector((state) => state.user as NotificationUser);
    const [notifications, setNotifications] = useState<NotificationItem[]>([]);
    useEffect(() => {
        if (!user) {
            setNotifications([]);
            return;
        }
        getMyNotifications().then((res) => {
            setNotifications(Array.isArray(res) ? res : []);
        }).catch((err) => console.log(err));
    }, [user]);
    const unread=(index:number)=>{
        let notis=[...notifications];
        notis=notis.filter((_noti, i:number)=>i!=index);
        setNotifications(notis);
        readNotification(notifications[index].id).then((_res)=>{}).catch((err)=>console.log(err));
    }
    const [opened, setOpened] = useState(false);
    return <Menu shadow="md" width={400} opened={opened} onChange={setOpened}>
        <Menu.Target>
            <div className=" bg-mine-shaft-900 p-1.5 rounded-full">
                <Indicator disabled={notifications.length<=0} color="brightSun.4" offset={6} size={8} processing>
                    <IconBell stroke={1.5} />
                </Indicator>
            </div>
        </Menu.Target>

        <Menu.Dropdown onChange={() => setOpened(true)}>
            <div className="flex flex-col gap-1">
                {
                    notifications.map((noti, index:number) => <Notification onClick={()=>{
                        navigate(noti.route);
                        setOpened(false);
                        unread(index);
                    }}
                     key={index} className="hover:bg-mine-shaft-900 cursor-pointer" onClose={()=>unread(index)} icon={<IconCheck  style={{ width: rem(20), height: rem(20) }} />} color="teal" title={noti.action} mt="md">
                        {noti.message}
                    </Notification>
)}
{
    notifications.length==0 && <div className="text-center text-mine-shaft-300">No Notifications</div>
}
            </div>

        </Menu.Dropdown>
    </Menu>
}
export default NotiMenu;