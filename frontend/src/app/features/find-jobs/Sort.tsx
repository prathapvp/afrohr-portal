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
    <Combobox.Option className='!text-xs !text-slate-200 hover:!bg-cyan-500/20' value={item} key={item}>
      {item}
    </Combobox.Option>
  )):talentSort.map((item) => (
    <Combobox.Option className='!text-xs !text-slate-200 hover:!bg-cyan-500/20' value={item} key={item}>
      {item}
    </Combobox.Option>
  ));

  return (
      <Combobox
        store={combobox}
        width={150}
        position="bottom-start"
        withinPortal={false}
        onOptionSubmit={(val) => {
          setSelectedItem(val);
          dispatch(updateSort(val));
          combobox.closeDropdown();
        }}
      >
        <Combobox.Target>
          <button
            type="button"
            onClick={() => combobox.toggleDropdown()}
            className="flex cursor-pointer items-center rounded-xl border border-cyan-300/35 bg-cyan-500/12 px-2 py-1 pr-1 text-sm font-medium text-cyan-100 transition-colors hover:bg-cyan-500/22 xs-mx:px-1 xs-mx:py-0 xs-mx:text-xs xsm-mx:mt-2"
            aria-label="Sort options"
          >
            {selectedItem}
            <ActionIcon color="cyan" variant="transparent" aria-hidden="true" tabIndex={-1}>
              <IconAdjustments style={{ width: '70%', height: '70%' }} stroke={1.5} />
            </ActionIcon>
          </button>
        </Combobox.Target>

        <Combobox.Dropdown className="!rounded-xl !border !border-cyan-300/20 !bg-slate-900/95 !backdrop-blur-sm">
          <Combobox.Options>{options}</Combobox.Options>
        </Combobox.Dropdown>
      </Combobox>
  );
}
export default Sort;