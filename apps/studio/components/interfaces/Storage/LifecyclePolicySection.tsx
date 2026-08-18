import type { Control } from 'react-hook-form'
import {
  FormControl,
  FormField,
  FormInputGroupInput,
  InputGroup,
  InputGroupAddon,
  InputGroupText,
} from 'ui'
import { Admonition } from 'ui-patterns/Admonition'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'

import type { BucketVersioningFormValues } from './BucketVersioningFields.schema'
import { ExpirationModeToggle } from './ExpirationModeToggle'
import type { ExpirationMode } from './StorageVersioning.constants'

/** Digits only, so a partially typed value never lands in form state as `NaN`. */
const toFieldValue = (rawInput: string): '' | number => {
  const digits = rawInput.replace(/[^0-9]/g, '')
  return digits === '' ? '' : Number(digits)
}

interface LifecyclePolicySectionProps {
  control: Control<BucketVersioningFormValues>
  /** The age condition is part of the policy. */
  hasDays: boolean
  /** The count condition is part of the policy. */
  hasVersions: boolean
  mode: ExpirationMode
  onModeChange: (mode: ExpirationMode) => void
}

export const LifecyclePolicySection = ({
  control,
  hasDays,
  hasVersions,
  mode,
  onModeChange,
}: LifecyclePolicySectionProps) => {
  const hasNoPolicy = !hasDays && !hasVersions
  const hasBothConditions = hasDays && hasVersions

  return (
    <div className="flex flex-col gap-y-2">
      <p className="text-sm font-medium text-foreground">Lifecycle policy</p>

      <FormField
        name="version_expiry_days"
        control={control}
        render={({ field }) => (
          <FormItemLayout
            name="version_expiry_days"
            label="Noncurrent version expiration"
            layout="flex-row-reverse"
          >
            <FormControl>
              <InputGroup>
                <FormInputGroupInput
                  id={field.name}
                  name={field.name}
                  ref={field.ref}
                  onBlur={field.onBlur}
                  type="number"
                  inputMode="numeric"
                  placeholder="—"
                  value={field.value}
                  onChange={(e) => field.onChange(toFieldValue(e.target.value))}
                />
                <InputGroupAddon align="inline-end">
                  <InputGroupText>days</InputGroupText>
                </InputGroupAddon>
              </InputGroup>
            </FormControl>
          </FormItemLayout>
        )}
      />

      <FormField
        name="max_noncurrent_versions"
        control={control}
        render={({ field }) => (
          <FormItemLayout
            name="max_noncurrent_versions"
            label="Retained noncurrent versions"
            layout="flex-row-reverse"
          >
            <FormControl>
              <InputGroup>
                <FormInputGroupInput
                  id={field.name}
                  name={field.name}
                  ref={field.ref}
                  onBlur={field.onBlur}
                  type="number"
                  inputMode="numeric"
                  placeholder="—"
                  value={field.value}
                  onChange={(e) => field.onChange(toFieldValue(e.target.value))}
                />
                <InputGroupAddon align="inline-end">
                  <InputGroupText>versions</InputGroupText>
                </InputGroupAddon>
              </InputGroup>
            </FormControl>
          </FormItemLayout>
        )}
      />

      {hasBothConditions && <ExpirationModeToggle mode={mode} onModeChange={onModeChange} />}

      {hasNoPolicy && (
        <Admonition
          type="warning"
          className="mt-2"
          title="No lifecycle policy"
          description="Every noncurrent version counts toward storage usage until you delete it. Set a retention window or a version cap to expire outdated versions automatically."
        />
      )}
    </div>
  )
}
