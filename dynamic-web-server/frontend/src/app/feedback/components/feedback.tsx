"use client"

import React from "react"
import { useForm } from "react-hook-form"
import {
  Form, 
  FormControl, 
  FormDescription, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { SendIcon, MailIcon } from "lucide-react"

// Define the form values type
type ContactFormValues = {
  insta: string
  gender: string
  subject: string
  message: string
  subscribe: boolean
}

export default function FeedbackForm() {
  const form = useForm<ContactFormValues>({
    defaultValues: {
      insta: "",
      gender: "",
      subject: "",
      message: "",
      subscribe: false,
    },
  })

  function onSubmit(data: ContactFormValues) {
    console.log(data)
    alert(`Form submitted successfully!\n\n${JSON.stringify(data, null, 2)}`)
    form.reset()
  }

  return (
    <div className="w-full max-w-3xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
      <Card>
        <CardHeader className="text-center pb-6 border-b">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full">
            <MailIcon className="h-6 w-6" />
          </div>
          <CardTitle className="text-3xl font-bold">what up bro? 👀</CardTitle>
          <CardDescription className="text-base mt-2">
            share me something man i made this website
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="insta"
                  rules={{ required: "pls :(" }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>insta</FormLabel>
                      <FormControl>
                        <Input placeholder="mnkhtrii" {...field} className="w-full" />
                      </FormControl>
                      <FormDescription className="text-xs">
                        i will send you reels
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="gender"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>gender</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="pick one" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="attack helicopter">Attack helicopter</SelectItem>
                          <SelectItem value="female">Justin</SelectItem>
                          <SelectItem value="girl">idk man</SelectItem>
                          <SelectItem value="biphoric transexual megamonster">biphoric transexual megamonster</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="subject"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>here yo go</FormLabel>
                      <FormControl>
                        <Input placeholder="say something." {...field} className="w-full" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="message"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>say more</FormLabel>
                    <FormControl>
                      <Textarea placeholder="all the juicy deets go here..." className="min-h-36 resize-y" {...field} />
                    </FormControl>
                    <FormDescription className="text-xs">
                      tell more.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="subscribe"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                    <FormControl>
                      <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>just to prove i can do checkboxes</FormLabel>
                      <FormDescription className="text-xs">
                        if you like my website then click appreciate it
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />
              <div className="flex justify-end space-x-4 pt-4">
                <Button type="button" onClick={() => form.reset()}>
                  Nvm
                </Button>
                <Button type="submit">
                  <SendIcon className="mr-2 h-4 w-4" />
                  Yeet It!
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}