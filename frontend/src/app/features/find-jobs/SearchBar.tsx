import { Button, Collapse, Divider, RangeSlider } from "@mantine/core";

import MultiInput from "./MultiInput";
import React, { useEffect, useState } from "react";
import { dropdownData } from "../../data/JobsData";
import { useDispatch, useSelector } from "react-redux";
import { updateFilter } from "../../store/slices/FilterSlice";
import { useDisclosure, useMediaQuery } from "@mantine/hooks";

const SearchBar = () => {
    const matches = useMediaQuery('(max-width: 475px)');
    const filter=useSelector((state:any)=>state.filter);
    const [opened, { toggle }] = useDisclosure(false);
    const dispatch = useDispatch();
    const [value, setValue] = useState<[number, number]>([0, 300]);
    const handleChange = (event: any) => {
        dispatch(updateFilter({ salary: event }));
    }
    useEffect(()=>{
        if(!filter.salary)setValue([0, 300]);
    }, [filter])




    return (<div className="mt-2">
        <div className="flex justify-end">

         {matches&&<Button onClick={toggle} m="sm" radius="xl" className="align border-white/20 bg-white/[0.03]" variant="outline" color="brightSun.4" autoContrast >{opened?"Close Filters":"Open Filters"}</Button>}
        </div>
        <Collapse in={(opened || !matches)}>
        <div className="rounded-2xl border border-white/12 bg-[linear-gradient(180deg,rgba(17,24,39,0.75),rgba(2,6,23,0.78))] px-4 py-5 lg-mx:!flex-wrap items-center !text-mine-shaft-100 flex shadow-[0_14px_40px_rgba(0,0,0,0.28)] sm:px-5 sm:py-6">

            {
                dropdownData.map((item, index) => {
                    return <React.Fragment key={index}><div className="w-1/5 lg-mx:w-1/4 bs-mx:w-[30%] sm-mx:w-[48%] xs-mx:w-full xs-mx:mb-1" ><MultiInput title={item.title} icon={item.icon} options={item.options} />
                    </div>
                        <Divider className="sm-mx:hidden" mr="xs" size="xs" orientation="vertical" /></React.Fragment>

                })
            }
            <div className="w-1/5 lg-mx:w-1/4 lg-mx:mt-7 bs-mx:w-[30%] xs-mx:mb-1 sm-mx:w-[48%] rounded-xl border border-white/10 bg-white/[0.02] px-3 py-2 text-sm text-mine-shaft-300 [&_.mantine-Slider-label]:!translate-y-10 xs-mx:w-full">
                <div className="flex mb-1 justify-between">
                    <div className="text-mine-shaft-200">Salary</div>
                    <div className="font-semibold text-bright-sun-300">&#36;{value[0]} K - &#36;{value[1]} K</div>
                </div>
                <RangeSlider color="brightSun.4" size="xs" value={value} onChange={setValue} onChangeEnd={handleChange} />
            </div>
        </div>
        </Collapse>
    </div>
    )
}
export default SearchBar;