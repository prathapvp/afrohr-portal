import { ComponentType, useEffect, useState } from 'react';
import { Combobox, InputBase, ScrollArea, useCombobox } from '@mantine/core';

interface ProfileSelectInputProps {
  label?: string;
  placeholder?: string;
  styles?: unknown;
  options: string[];
  name: string;
  leftSection: ComponentType<{ className?: string; stroke?: number }>;
  form: {
    getInputProps: (name: string) => { value: string; [key: string]: unknown };
    setFieldValue: (name: string, value: string) => void;
  };
}

const SelectInput=(props: ProfileSelectInputProps)=> {
    useEffect(()=>{
    setData(Array.isArray(props.options) ? props.options : []);
    const nextValue = props.form.getInputProps(props.name).value;
    setValue(typeof nextValue === 'string' ? nextValue : '');
    setSearch(typeof nextValue === 'string' ? nextValue : '');
  }, [props.form, props.name, props.options])
  const combobox = useCombobox({
    onDropdownClose: () => combobox.resetSelectedOption(),
  });

  const [data, setData] = useState<string[]>([]);
  const [value, setValue] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const safeSearch = typeof search === 'string' ? search : '';

  const exactOptionMatch = data.some((item) => item === safeSearch);
  const filteredOptions = exactOptionMatch
    ? data
    : data.filter((item) => item.toLowerCase().includes(safeSearch.toLowerCase().trim()));

  const options = filteredOptions.map((item) => (
    <Combobox.Option value={item} key={item}>
      {item}
    </Combobox.Option>
  ));

  return (
    <Combobox
      store={combobox}
      withinPortal
      zIndex={900}
      onOptionSubmit={(val) => {
        if (val === '$create') {
          setData((current) => [...current, search]);
          setValue(search);
          props.form.setFieldValue(props.name,search);
        } else {
          setValue(val);
          setSearch(val);
          props.form.setFieldValue(props.name,val);
        }
        combobox.closeDropdown();
      }}
    >
      <Combobox.Target>
        <InputBase data-aos="zoom-out"
        label={props.label} withAsterisk
          styles={props.styles}
          rightSection={<Combobox.Chevron />}
          leftSection={<props.leftSection className="" stroke={1.5}/>}
          {...props.form.getInputProps(props.name)}
          value={search}
          onChange={(event) => {
            combobox.openDropdown();
            combobox.updateSelectedOptionIndex();
            setSearch(event.currentTarget.value);
          }}
          onClick={() => combobox.openDropdown()}
          onFocus={() => combobox.openDropdown()}
          onBlur={() => {
            combobox.closeDropdown();
            setSearch(value || '');
          }}
          placeholder={props.placeholder}
          rightSectionPointerEvents="none"
        />
      </Combobox.Target>

      <Combobox.Dropdown>
        <Combobox.Options>
        <ScrollArea.Autosize mah={200} type="scroll">
          {options.length > 0 ? options : <Combobox.Empty>Nothing found</Combobox.Empty>}
          {!exactOptionMatch && safeSearch.trim().length > 0 && (
            <Combobox.Option value="$create">+ Create {search}</Combobox.Option>
          )}
          </ScrollArea.Autosize>
        </Combobox.Options>
      </Combobox.Dropdown>
    </Combobox>
  );
}
export default SelectInput;