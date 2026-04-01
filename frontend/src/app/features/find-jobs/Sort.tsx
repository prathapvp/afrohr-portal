import { useState } from 'react';
import { Combobox, useCombobox, ActionIcon } from '@mantine/core';
import { IconAdjustments } from '@tabler/icons-react';
import { useAppDispatch } from '../../store';
import { updateSort } from '../../store/slices/SortSlice';

const opt = ['Relevance','Most Recent', 'Salary: Low to High', 'Salary: High to Low'];
const talentSort=['Relevance', 'Experience: Low to High', 'Experience: High to Low'];

interface SortProps {
  sort?: 'job' | 'talent';
}

const Sort=(props: SortProps)=> {
  const dispatch = useAppDispatch();
  const [selectedItem, setSelectedItem] = useState<string | null>('Relevance');
  const combobox = useCombobox({
    onDropdownClose: () => combobox.resetSelectedOption(),
  });

  const options = props.sort === "job" ? opt.map((item) => (
    <Combobox.Option className='!text-xs' value={item} key={item}>
      {item}
    </Combobox.Option>
  )):talentSort.map((item) => (
    <Combobox.Option className='!text-xs' value={item} key={item}>
      {item}
    </Combobox.Option>
  ));

  return (
      <Combobox
        store={combobox}
        width={150}
        position="bottom-start"
        onOptionSubmit={(val) => {
          setSelectedItem(val);
          dispatch(updateSort(val));
          combobox.closeDropdown();
        }}
      >
        <Combobox.Target>
          <div onClick={() => combobox.toggleDropdown()} className="flex cursor-pointer items-center rounded-xl border border-bright-sun-400/45 bg-bright-sun-400/10 px-2 py-1 pr-1 text-sm text-bright-sun-100 transition-colors hover:bg-bright-sun-400/15 xs-mx:px-1 xs-mx:py-0 xs-mx:text-xs xsm-mx:mt-2">{selectedItem} <ActionIcon color="brightSun.4" variant="transparent" aria-label="Settings">
                <IconAdjustments style={{ width: '70%', height: '70%' }} stroke={1.5} />
            </ActionIcon></div>
        </Combobox.Target>

        <Combobox.Dropdown>
          <Combobox.Options>{options}</Combobox.Options>
        </Combobox.Dropdown>
      </Combobox>
  );
}
export default Sort;