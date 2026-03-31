import { Anchor, Avatar, Button, Divider, Modal, Text } from "@mantine/core";
import { DateInput, TimeInput } from "@mantine/dates";
import { useDisclosure } from "@mantine/hooks";
import { IconCalendarMonth, IconHeart, IconMapPin } from "@tabler/icons-react";
import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getProfile } from "../../services/ProfileService";
import { formatInterviewTime, openPDF } from "../../services/utilities";
import { changeAppStatus } from "../../services/JobService";
import { errorNotification, successNotification } from "../../services/NotificationService";

const TalentCard = (props: any) => {
    const { id } = useParams();
    const ref = useRef<HTMLInputElement>(null);
    const [opened, { open, close }] = useDisclosure(false);
    const [app, { open: openApp, close: closeApp }] = useDisclosure(false);
    const [date, setDate] = useState<Date | null>(null);
    const [time, setTime] = useState<any>(null);
    const [profile, setProfile] = useState<any>(null);
    const handleOffer = (status: string) => {
        let interview: any = { id, applicantId: profile?.id, applicationStatus: status };
        if (status == "INTERVIEWING") {
            const [hours, minutes] = time.split(':').map(Number);
            date?.setHours(hours);
            date?.setMinutes(minutes);
            interview = { ...interview, interviewTime: date }
        }
        changeAppStatus(interview).then((res) => {
            if (status == "INTERVIEWING") successNotification('Interview Scheduled', 'Interview has been scheduled successfully');
            else if (status == "OFFERED") successNotification('Offered', 'Offer has been sent successfully');
            else successNotification('Rejected', 'Offer has been rejected');
            window.location.reload();
        }).catch((err) => {
            console.log(err)
            errorNotification('Error', err.response.data.errorMessage);
        });

    }
    useEffect(() => {
        if (props.applicantId) getProfile(props.applicantId).then((res) => {
            setProfile(res);
        }).catch((err) => console.log(err))
        else setProfile(props);
    }, [props])
    return <div data-aos="fade-up" className="premium-card-hover w-96 bs-mx:w-[48%] md-mx:w-full flex flex-col gap-3 rounded-2xl border border-white/12 bg-[linear-gradient(180deg,rgba(17,24,39,0.9),rgba(2,6,23,0.95))] p-4 shadow-[0_16px_46px_rgba(0,0,0,0.35)] hover:-translate-y-0.5 hover:border-bright-sun-400/30">
        <div className="flex justify-between">
            <div className="flex gap-2 items-center">
                <div className="rounded-full border border-white/10 bg-mine-shaft-800/80 p-2">
                    <Avatar className="rounded-full" size="lg" src={profile?.picture ? `data:image/jpeg;base64,${profile?.picture}` : '/avatar.svg'} />
                </div>
                <div className="flex flex-col gap-1">
                    <div className="font-semibold text-lg">{props?.name}</div>
                    <div className="text-sm text-mine-shaft-300">{profile?.jobTitle} &bull; {profile?.company}</div>

                </div>
            </div>
            <IconHeart className="cursor-pointer text-mine-shaft-300" stroke={1.5} />
        </div>
        <div className="flex gap-2 flex-wrap ">
            {profile?.skills?.map((skill: any, index: any) => index < 4 && <div key={index} className="rounded-full border border-bright-sun-400/25 bg-bright-sun-400/10 px-2.5 py-1 text-xs font-medium text-bright-sun-300">{skill}</div>)}
        </div>
        <div>
            <Text className="!text-xs text-justify !text-mine-shaft-300" lineClamp={3}>{profile?.about}
            </Text>
        </div>
        <Divider color="mineShaft.7" size="xs" />
        {
            props.invited ? <div className="flex gap-1 text-mine-shaft-200 text-sm items-center">
                <IconCalendarMonth stroke={1.5} /> Interview: {formatInterviewTime(props.interviewTime)}
            </div> : <div className="flex justify-between">
                <div className="font-medium text-mine-shaft-200">Exp: {profile?.totalExp ? profile?.totalExp : 1} Years</div>
                <div className="text-xs flex gap-1 items-center text-mine-shaft-400">
                    <IconMapPin className="h-5 w-5" /> {profile?.location}
                </div>
            </div>
        }
        <Divider color="mineShaft.7" size="xs" />
        <div className="flex [&>*]:w-1/2 [&>*]:p-1">
            {
                !props.invited && <>
                    <Link to={`/talent-profile/${profile?.id}`}>
                        <Button color="brightSun.4" variant="outline" fullWidth>Profile</Button>
                    </Link>

                    <div>
                        {/* {props.posted ? <Button color="brightSun.4" variant="light" onClick={open} rightSection={<IconCalendarMonth className="w-5 h-5" />} fullWidth>Schedule</Button> : <Button color="brightSun.4" variant="light" fullWidth>Message</Button>} */}

                        {props.posted ? (
                            <Button
                                color="brightSun.4"
                                variant="light"
                                onClick={openApp}
                                fullWidth
                            >
                                View Application
                            </Button>
                        ) : (
                            <Anchor
                                href={`https://wa.me/${props?.mobileNumber}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-full"
                            >
                                <Button color="green" variant="light" fullWidth>
                                    WhatsApp
                                </Button>
                            </Anchor>
                        )}


                    </div>
                </>
            }{

                props.invited && <>
                    <div>

                        <Button onClick={() => handleOffer("OFFERED")} color="brightSun.4" variant="outline" fullWidth>Accept</Button>
                    </div>
                    <div>

                        <Button onClick={() => handleOffer("REJECTED")} color="brightSun.4" variant="light" fullWidth>Reject</Button>
                    </div>
                </>
            }
        </div>
        {(props.invited || props.posted) && <Button color="brightSun.4" variant="filled" onClick={openApp} autoContrast fullWidth>View Application</Button>}
        <Modal opened={opened} onClose={close} radius="lg" title="Schedule Interview" centered>
            <div className="flex flex-col gap-4">
                <DateInput value={date} onChange={setDate} minDate={new Date()} label="Date" placeholder="Enter Date" />
                <TimeInput label="Time" ref={ref} value={time}
                    onChange={(event) => setTime(event.currentTarget.value)} minTime="" onClick={() => ref.current?.showPicker()} />
                <Button onClick={() => handleOffer("INTERVIEWING")} color="brightSun.4" variant="light" fullWidth>Schedule</Button>
            </div>
        </Modal>
        <Modal opened={app} onClose={closeApp} radius="lg" title="Application" centered>
            <div className="flex flex-col gap-4">
                <div>
                    Email: &emsp;
                    <a
                        className="text-bright-sun-400 hover:underline cursor-pointer"
                        href={`mailto:${props?.email}`}
                    >
                        {props?.email}
                    </a>
                </div>

                <div>
                    Mobile Number: &emsp;
                    <span className="text-bright-sun-400">
                        {props?.mobileNumber}
                    </span>
                </div>

                <div>
                    Website: &emsp;
                    <a
                        className="text-bright-sun-400 hover:underline cursor-pointer"
                        target="_blank"
                        rel="noopener noreferrer"
                        href={props?.website}
                    >
                        {props?.website}
                    </a>
                </div>

                <div>
                    Resume: &emsp;
                    <span
                        className="text-bright-sun-400 hover:underline cursor-pointer"
                        onClick={() => openPDF(props?.resume)}
                    >
                        {props?.name}
                    </span>
                </div>

                <div>
                    Skills: &emsp;
                    <span className="text-bright-sun-400">
                        {props?.skills}
                    </span>
                </div>

                <div>
                    Education: &emsp;
                    <span className="text-bright-sun-400">
                        {props?.education}
                    </span>
                </div>

                <div>
                    Current Position: &emsp;
                    <span className="text-bright-sun-400">
                        {props?.currentPosition}
                    </span>
                </div>

                <div>
                    CTC: &emsp;
                    <span className="text-bright-sun-400">
                        {props?.ctc}
                    </span>
                </div>

                <div>
                    Experience: &emsp;
                    <span className="text-bright-sun-400">
                        {props?.experience}
                    </span>
                </div>

                <div>
                    Current Location: &emsp;
                    <span className="text-bright-sun-400">
                        {props?.currentLocation}
                    </span>
                </div>

                <div>
                    Cover Letter: &emsp;
                    <div className="text-wrap">
                        {props?.coverLetter}
                    </div>
                </div>

                <Divider color="mineShaft.7" size="xs" />

                {/* Action Buttons */}
                <div className="flex gap-2">
                    <Button
                        color="brightSun.4"
                        variant="outline"
                        fullWidth
                        onClick={() => handleOffer("OFFERED")}
                    >
                        Shortlisted
                    </Button>

                    <Button
                        color="brightSun.4"
                        variant="light"
                        fullWidth
                        onClick={() => handleOffer("REJECTED")}
                    >
                        Rejected
                    </Button>
                </div>
            </div>
        </Modal>

    </div>
}
export default TalentCard;