import { useEffect, useState, type ReactNode } from 'react';
import { Combobox, InputBase, ScrollArea, useCombobox } from '@mantine/core';

type SelectOption = string | { value: string; label: string };

interface SelectInputProps {
  options?: SelectOption[];
  form: {
    getInputProps: (name: string) => { value: string; [key: string]: unknown };
    setFieldValue: (name: string, value: string) => void;
  };
  name: string;
  label?: ReactNode;
  placeholder?: string;
  withAsterisk?: boolean;
}

const SelectInput = (props: SelectInputProps) => {
  const [data, setData] = useState<SelectOption[]>([]);
  const [value, setValue] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const combobox = useCombobox({
    onDropdownClose: () => combobox.resetSelectedOption(),
  });

  const fieldValueRaw = props.form.getInputProps(props.name).value;
  const fieldValue = typeof fieldValueRaw === 'string' ? fieldValueRaw : '';

  useEffect(() => {
    setData(Array.isArray(props.options) ? props.options : []);
    setValue(fieldValue);
    setSearch(fieldValue);
  }, [fieldValue, props.name, props.options]);

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
      <Combobox.Option
        value={val}
        key={val}
        className="!bg-transparent !text-slate-200 transition-colors hover:!bg-white/10 data-[combobox-selected]:!bg-emerald-500/20 data-[combobox-selected]:!text-emerald-200"
      >
        {label}
      </Combobox.Option>
    );
  });

  const premiumInputStyles = {
    label: {
      color: '#d1d5db',
      fontWeight: 600,
      marginBottom: '6px',
    },
    input: {
      background: 'rgba(15, 23, 42, 0.65)',
      color: '#f3f4f6',
      borderColor: 'rgba(255,255,255,0.14)',
      transition: 'all 140ms ease',
    },
    dropdown: {
      background: 'rgba(15, 23, 42, 0.96)',
      borderColor: 'rgba(255,255,255,0.14)',
      backdropFilter: 'blur(6px)',
    },
    option: {
      color: '#e5e7eb',
    },
  };

  return (
    <Combobox
      store={combobox}
      withinPortal
      zIndex={900}
      styles={{
        dropdown: {
          backgroundColor: 'rgba(15, 23, 42, 0.98)',
          border: '1px solid rgba(255, 255, 255, 0.14)',
          color: '#e5e7eb',
          backdropFilter: 'blur(8px)',
        },
        options: {
          backgroundColor: 'transparent',
        },
        option: {
          color: '#e5e7eb',
          backgroundColor: 'transparent',
        },
      }}
      classNames={{
        dropdown: 'z-[600] border border-white/10 bg-slate-900/95 backdrop-blur-md',
        options: 'bg-transparent',
        option: '!bg-slate-900/95 !text-slate-200 transition-colors hover:!bg-white/10 data-[combobox-selected]:!bg-emerald-500/20 data-[combobox-selected]:!text-emerald-200',
      }}
      onOptionSubmit={(val) => {
        setValue(val);
        setSearch(val);
        props.form.setFieldValue(props.name, val);

        combobox.closeDropdown();
      }}
    >
      <Combobox.Target>
        <InputBase
          withAsterisk={props.withAsterisk ?? true}
          label={props.label}
          rightSection={<Combobox.Chevron />}
          styles={premiumInputStyles}
          classNames={{
            section: 'text-slate-300',
          }}
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
          </ScrollArea.Autosize>
        </Combobox.Options>
      </Combobox.Dropdown>
    </Combobox>
  );
};

export default SelectInput;
