import {
  Controller,
  type ControllerProps,
  type FieldPath,
  type FieldValues,
} from "react-hook-form";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "./ui/field";
import { Input } from "./ui/input";
import type { ReactNode } from "react";
import { Textarea } from "./ui/textarea";
import { Select, SelectContent, SelectTrigger, SelectValue } from "./ui/select";
import { Checkbox } from "./ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Button } from "./ui/button";
import { Check, ChevronsUpDown } from "lucide-react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "./ui/command";
import { CommandList } from "cmdk";

type FormControlProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
  TTransformedValues = TFieldValues,
> = {
  name: TName;
  label: ReactNode;
  description?: ReactNode;
  control: ControllerProps<TFieldValues, TName, TTransformedValues>["control"];
};

type FormBaseProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
  TTransformedValues = TFieldValues,
> = FormControlProps<TFieldValues, TName, TTransformedValues> & {
  horizontal?: boolean;
  controlFirst?: boolean;
  children: (
    field: Parameters<
      ControllerProps<TFieldValues, TName, TTransformedValues>["render"]
    >[0]["field"] & {
      "aria-invalid": boolean;
      id: string;
    },
  ) => ReactNode;
};

type FormControlFunc<
  ExtraProps extends Record<string, unknown> = Record<never, never>,
> = <
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
  TTransformedValues = TFieldValues,
>(
  props: FormControlProps<TFieldValues, TName, TTransformedValues> & ExtraProps,
) => ReactNode;

function FormBase<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
  TTransformedValues = TFieldValues,
>({
  children,
  control,
  label,
  name,
  description,
  controlFirst,
  horizontal,
}: FormBaseProps<TFieldValues, TName, TTransformedValues>) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => {
        const labelElement = (
          <>
            <FieldLabel htmlFor={field.name}>{label}</FieldLabel>
            {description && <FieldDescription>{description}</FieldDescription>}
          </>
        );
        const control = children({
          ...field,
          id: field.name,
          "aria-invalid": fieldState.invalid,
        });
        const errorElem = fieldState.invalid && (
          <FieldError errors={[fieldState.error]} />
        );

        return (
          <Field
            data-invalid={fieldState.invalid}
            orientation={horizontal ? "horizontal" : undefined}
          >
            {controlFirst ? (
              <>
                {control}
                <FieldContent>
                  {labelElement}
                  {errorElem}
                </FieldContent>
              </>
            ) : (
              <>
                <FieldContent>{labelElement}</FieldContent>
                {control}
                {errorElem}
              </>
            )}
          </Field>
        );
      }}
    />
  );
}

type Placeholder = { placeholder?: string };

export const FormInput: FormControlFunc<Placeholder> = (props) => {
  return (
    <FormBase {...props}>
      {(field) => <Input {...field} placeholder={props.placeholder} />}
    </FormBase>
  );
};

export const FormTextarea: FormControlFunc<Placeholder> = (props) => {
  return (
    <FormBase {...props}>
      {(field) => <Textarea {...field} placeholder={props.placeholder} />}
    </FormBase>
  );
};

export const FormSelect: FormControlFunc<{ children: ReactNode }> = ({
  children,
  ...props
}) => {
  return (
    <FormBase {...props}>
      {({ onChange, onBlur, ...field }) => (
        <Select {...field} onValueChange={onChange}>
          <SelectTrigger
            aria-invalid={field["aria-invalid"]}
            id={field.id}
            onBlur={onBlur}
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>{children}</SelectContent>
        </Select>
      )}
    </FormBase>
  );
};

export type ComboboxOption = { value: string; label: string };

export const FormCombobox: FormControlFunc<{
  options: ComboboxOption[];
  placeholder?: string;
  searchPlaceholder?: string;
  emptyText?: string;
  disabled?: boolean;
}> = ({
  options,
  placeholder = "Select…",
  searchPlaceholder = "Search…",
  emptyText = "No results.",
  disabled,
  ...props
}) => {
  return (
    <FormBase {...props}>
      {({ value, onChange, "aria-invalid": ariaInvalid, id }) => {
        const selected = options.find((o) => o.value === value);

        return (
          <Popover modal>
            <PopoverTrigger asChild>
              <Button
                id={id}
                type="button"
                variant="outline"
                role="combobox"
                aria-invalid={ariaInvalid}
                aria-expanded="false"
                disabled={disabled}
                className="justify-between"
              >
                {selected?.label ?? placeholder}
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>

            <PopoverContent className="p-0" align="start">
              <Command>
                <CommandInput placeholder={searchPlaceholder} />
                <CommandList className="max-h-60 overflow-y-auto">
                  <CommandEmpty>{emptyText}</CommandEmpty>
                  <CommandGroup>
                    {options.map((opt) => (
                      <CommandItem
                        key={opt.value}
                        value={opt.label}
                        onSelect={() => onChange(opt.value)}
                      >
                        <Check
                          className={[
                            "mr-2 h-4 w-4",
                            opt.value === value ? "opacity-100" : "opacity-0",
                          ].join(" ")}
                        />
                        {opt.label}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        );
      }}
    </FormBase>
  );
};

export const FormCheckbox: FormControlFunc = (props) => {
  return (
    <FormBase {...props} horizontal controlFirst>
      {({ onChange, value, ...field }) => (
        <Checkbox {...field} checked={value} onCheckedChange={onChange} />
      )}
    </FormBase>
  );
};

export const FormDateTimeLocal: FormControlFunc = (props) => {
  return (
    <FormBase {...props}>
      {({ value, onChange, ...field }) => (
        <Input
          {...field}
          type="datetime-local"
          value={dateToDateTimeLocalValue(value)}
          onChange={(e) => onChange(dateTimeLocalValueToDate(e.target.value))}
        />
      )}
    </FormBase>
  );
};

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

// Date -> "YYYY-MM-DDTHH:mm" (LOCAL)
export function dateToDateTimeLocalValue(d: unknown): string {
  if (!(d instanceof Date) || Number.isNaN(d.getTime())) return "";
  const y = d.getFullYear();
  const m = pad2(d.getMonth() + 1);
  const day = pad2(d.getDate());
  const hh = pad2(d.getHours());
  const mm = pad2(d.getMinutes());
  return `${y}-${m}-${day}T${hh}:${mm}`;
}

// "YYYY-MM-DDTHH:mm" -> Date (LOCAL)
export function dateTimeLocalValueToDate(s: string): Date | null {
  if (!s) return null;

  // Strictly accept "YYYY-MM-DDTHH:mm"
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(s);
  if (!match) return null;

  const y = Number(match[1]);
  const m = Number(match[2]); // 1-12
  const d = Number(match[3]); // 1-31
  const hh = Number(match[4]); // 0-23
  const mm = Number(match[5]); // 0-59

  // Basic range checks (optional but nice)
  if (
    !Number.isFinite(y) ||
    m < 1 ||
    m > 12 ||
    d < 1 ||
    d > 31 ||
    hh < 0 ||
    hh > 23 ||
    mm < 0 ||
    mm > 59
  ) {
    return null;
  }

  const dt = new Date(y, m - 1, d, hh, mm, 0, 0); // local time

  // Extra guard: reject impossible dates like 2026-02-31
  if (
    dt.getFullYear() !== y ||
    dt.getMonth() !== m - 1 ||
    dt.getDate() !== d ||
    dt.getHours() !== hh ||
    dt.getMinutes() !== mm
  ) {
    return null;
  }

  return dt;
}
