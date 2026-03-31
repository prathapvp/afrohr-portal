import { Menu, rem, Avatar, Switch } from '@mantine/core';
import {
    IconMessageCircle,
    IconLogout2,
    IconUserCircle,
    IconFileText,
    IconSun,
    IconMoonStars,
    IconMoon,
} from '@tabler/icons-react';
import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { useNavigate } from 'react-router';
import { removeUser } from '../../../store/slices/UserSlice';
import { removeJwt } from '../../../store/slices/JwtSlice';
import { clearProfile } from '../../../store/slices/ProfileSlice';

interface ProfileMenuProps {
    colorScheme: string;
    toggleColorScheme: () => void;
}

const ProfileMenu = ({ colorScheme, toggleColorScheme }: ProfileMenuProps) => {
    const user=useSelector((state:any)=>state.user);
    const profile=useSelector((state:any)=>state.profile);
    const [opened, setOpened] = useState(false);
    const [checked, setChecked] = useState(colorScheme === 'dark');
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const handleLogout=()=>{
        // Clear all PII data on logout
        dispatch(removeUser());
        dispatch(removeJwt());
        dispatch(clearProfile());
        setOpened(false);
        void navigate('/');
    }
    // Sync checked state with colorScheme prop
    // (in case colorScheme changes from outside)
    React.useEffect(() => {
        setChecked(colorScheme === 'dark');
    }, [colorScheme]);

    return (
        <Menu shadow="md" width={200} opened={opened} onChange={setOpened}>
            <Menu.Target><div className="flex items-center gap-2 cursor-pointer">
                <div className='xs-mx:hidden'>{user.name}</div>
                <Avatar src={profile.picture?`data:image/jpeg;base64,${profile.picture}`:'/avatar.svg'} alt="it's me" />
            </div>
            </Menu.Target>

            <Menu.Dropdown>
                <Link to="/profile" onClick={() => setOpened(false)}>
                <Menu.Item  leftSection={<IconUserCircle style={{ width: rem(14), height: rem(14) }} />}>
                    Profile
                </Menu.Item>
                </Link>
                <Menu.Item leftSection={<IconMessageCircle style={{ width: rem(14), height: rem(14) }} />}>
                    Messages
                </Menu.Item>
                <Menu.Item leftSection={<IconFileText style={{ width: rem(14), height: rem(14) }} />}>
                    Resume
                </Menu.Item>
                <Menu.Item
                    leftSection={<IconMoon style={{ width: rem(14), height: rem(14) }} />}
                    rightSection={
                        <Switch size="sm" color="dark" className='cursor-pointer'
                            onLabel={<IconSun
                                style={{ width: rem(14), height: rem(14) }}
                                stroke={2.5}
                                color="yellow"
                            />} offLabel={<IconMoonStars
                                style={{ width: rem(14), height: rem(14) }}
                                stroke={2.5}
                                color="cyan"
                            />}
                            checked={checked}
                            onChange={(event) => {
                                const nextChecked = event.currentTarget.checked;
                                setChecked(nextChecked);
                                if ((nextChecked && colorScheme !== 'dark') || (!nextChecked && colorScheme !== 'light')) {
                                    toggleColorScheme();
                                }
                            }}
                        />
                    }
                >
                    Dark Mode
                </Menu.Item>

                <Menu.Divider />

                <Menu.Item onClick={handleLogout}
                    color="red"
                    leftSection={<IconLogout2 style={{ width: rem(14), height: rem(14) }} />}
                >
                    Logout
                </Menu.Item>
            </Menu.Dropdown>
        </Menu>
    );
}
export default ProfileMenu;