<script setup lang="ts">
import {
  CalendarDate,
  DateFormatter,
  getLocalTimeZone,
  parseDate,
  today,
} from '@internationalized/date'
import { toTypedSchema } from '@vee-validate/zod'
import { CalendarIcon } from 'lucide-vue-next'
import { toDate } from 'reka-ui/date'
import { useForm } from 'vee-validate'
import { computed, h, ref } from 'vue'
import { z } from 'zod'
import { cn } from '@/utils/shadUtils'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { toast } from 'vue-sonner'

const { formLabel = 'Select a Date' } = defineProps<{
  formLabel?: string
}>()

const df = new DateFormatter('en-US', {
  dateStyle: 'long',
})

const formSchema = toTypedSchema(
  z.object({
    dob: z.string().refine((v) => v, { message: 'A date of birth is required.' }),
  }),
)

const placeholder = ref()

const { handleSubmit, setFieldValue, values } = useForm({
  validationSchema: formSchema,
})

const value = computed({
  get: () => (values.dob ? parseDate(values.dob) : undefined),
  set: (val) => val,
})

const onSubmit = handleSubmit((values) => {
  toast({
    title: 'You submitted the following values:',
    description: h(
      'pre',
      { class: 'mt-2 w-[340px] rounded-md bg-slate-950 p-4' },
      h('code', { class: 'text-white' }, JSON.stringify(values, null, 2)),
    ),
  })
})
</script>

<template>
  <form class="space-y-8" @submit="onSubmit">
    <FormField name="dob">
      <FormItem class="flex flex-col">
        <FormLabel>{{ formLabel }}</FormLabel>
        <Popover>
          <PopoverTrigger as-child>
            <FormControl>
              <Button
                variant="outline"
                :class="
                  cn('w-[240px] ps-3 text-start font-normal', !value && 'text-muted-foreground')
                "
              >
                <span>{{ value ? df.format(toDate(value)) : 'Pick a date' }}</span>
                <CalendarIcon class="ms-auto h-4 w-4 opacity-50" />
              </Button>
              <input hidden />
            </FormControl>
          </PopoverTrigger>
          <PopoverContent class="w-auto p-0">
            <Calendar
              v-model:placeholder="placeholder"
              :model-value="value"
              calendar-label="formLabel"
              initial-focus
              :min-value="new CalendarDate(1900, 1, 1)"
              :max-value="today(getLocalTimeZone())"
              @update:model-value="
                (v) => {
                  if (v) {
                    setFieldValue('dob', v.toString())
                  } else {
                    setFieldValue('dob', undefined)
                  }
                }
              "
            />
          </PopoverContent>
        </Popover>
        <FormMessage />
      </FormItem>
    </FormField>
  </form>
</template>
