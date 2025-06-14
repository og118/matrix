<script setup lang="ts">
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card'
import { Form, FormItem, FormLabel, FormDescription, FormField } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
</script>

<template>
  <Card class="w-[700px]">
    <CardHeader>
      <CardTitle>What did you do today?</CardTitle>
    </CardHeader>

    <CardContent>
      <Form>
        <FormField name="query">
          <FormItem>
            <FormLabel>Search</FormLabel>
            <Input placeholder="Search..." />
            <FormDescription>Search for a movie or a book</FormDescription>
          </FormItem>
        </FormField>
      </Form>
    </CardContent>

    <CardFooter class="flex justify-between px-6">
      <Button variant="outline" class="w-[250px]"> Cancel </Button>
      <Button class="w-[250px]">Submit</Button>
    </CardFooter>
  </Card>
</template>
