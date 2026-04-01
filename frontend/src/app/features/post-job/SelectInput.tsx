import { useEffect, useState } from 'react';
import { Combobox, InputBase, ScrollArea, useCombobox } from '@mantine/core';

type SelectOption = string | { value: string; label: string };

interface SelectInputProps {
  options?: SelectOption[];
  form: {
    getInputProps: (name: string) => { value: string; [key: string]: unknown };
    setFieldValue: (name: string, value: string) => void;
  };
  name: string;
  label?: string;
  placeholder?: string;
}

const SelectInput = (props: SelectInputProps) => {
  const [data, setData] = useState<SelectOption[]>([]);
  const [value, setValue] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const combobox = useCombobox({
    onDropdownClose: () => combobox.resetSelectedOption(),
  });

  useEffect(() => {
    // ✅ Updated: Initialize data and search/value properly
    setData(Array.isArray(props.options) ? props.options : []);
    const val = props.form.getInputProps(props.name).value;
    setValue(val);
    setSearch(val);
  }, [props]);

  const safeSearch = typeof search === 'string' ? search : '';

  // ✅ Updated: Filter options correctly for strings or objects
  const filteredOptions = data.filter((item) => {
    if (typeof item === 'string') return item.toLowerCase().includes(safeSearch.toLowerCase().trim());
    if (typeof item === 'object' && 'label' in item) return item.label.toLowerCase().includes(safeSearch.toLowerCase().trim());
    return false;
  });

  // ✅ Updated: Map options to Combobox.Option
  const options = filteredOptions.map((item) => {
    const val = typeof item === 'string' ? item : item.value;
    const label = typeof item === 'string' ? item : item.label;
    return (
      <Combobox.Option value={val} key={val}>
        {label}
      </Combobox.Option>
    );
  });

  // ✅ Updated: Check for exact match
  const exactOptionMatch = filteredOptions.some((item) => {
    if (typeof item === 'string') return item === safeSearch;
    if (typeof item === 'object' && 'value' in item) return item.value === safeSearch;
    return false;
  });

  return (
    <Combobox
      store={combobox}
      withinPortal={false}
      onOptionSubmit={(val) => {
        if (val === '$create') {
          setData((current) => [...current, search]);
          setValue(search);
          props.form.setFieldValue(props.name, search);
        } else {
          setValue(val);
          setSearch(val);
          props.form.setFieldValue(props.name, val); // ✅ Updated: save the value, not label
        }

        combobox.closeDropdown();
      }}
    >
      <Combobox.Target>
        <InputBase
          withAsterisk
          label={props.label}
          rightSection={<Combobox.Chevron />}
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
            {options}
            {!exactOptionMatch && search.trim().length > 0 && (
              <Combobox.Option value="$create">+ Create {search}</Combobox.Option>
            )}
          </ScrollArea.Autosize>
        </Combobox.Options>
      </Combobox.Dropdown>
    </Combobox>
  );
};

export default SelectInput;
