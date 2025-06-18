<script setup lang="ts">
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card'
import { Form, FormItem, FormField } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { toast } from 'vue-sonner'
// import { WordTyper } from '@/components/ui/typer'
import { useForm } from 'vee-validate'
import { ref } from 'vue'

// Form handling
const { handleSubmit, values } = useForm()
const searchQuery = ref('')

const onSubmit = handleSubmit(() => {
  // Get the current form values
  searchQuery.value = values.query || ''

  // Display a toast with the query value
  toast({
    title: 'Search Query',
    description: searchQuery.value || 'No query provided',
  })

  console.log('Form submitted with query:', searchQuery.value)
})
</script>

<template>
  <Card class="w-[700px]">
    <CardHeader>
      <CardTitle>
        What did you watch or read today?
        <!-- <WordTyper :display-text-array="[' read today?', ' watch today?']" cursor-color="#000000" /> -->
      </CardTitle>
    </CardHeader>

    <CardContent>
      <Form>
        <FormField name="query">
          <FormItem><Input placeholder="Search for a movie or a book..." /> </FormItem>
        </FormField>

        <!-- Display the current query value if available -->
        <div v-if="searchQuery" class="mt-4 text-sm">Current search: "{{ searchQuery }}"</div>
      </Form>
    </CardContent>

    <CardFooter class="flex justify-between px-6">
      <Button variant="outline" class="w-[250px]" type="button"> Cancel </Button>
      <Button class="w-[250px]" type="submit" @click="onSubmit">Submit</Button>
    </CardFooter>
  </Card>
</template>
