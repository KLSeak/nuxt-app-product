<script setup lang="ts">
definePageMeta({ layout: "dashboard", requiresAuth: true })

import { Icon } from '@iconify/vue'
import { ref, onMounted } from "vue"
import { useForm, useField } from "vee-validate"
import { toTypedSchema } from "@vee-validate/zod"
import { z } from "zod"

import { useMessage } from "~/composables/useMessage";

const { successMsg, errorMsg } = useMessage();

type Category = {
  id: number
  name: string
}

// Zod Schema
const schema = toTypedSchema(
  z.object({
    name: z.string().min(1, "Please enter product name"),

    category_id: z
      .number()
      .refine(v => v !== -1, {
        message: "Please select category",
      }),
  })
)

// Vee-validate form
const { handleSubmit, errors, isSubmitting, resetForm } = useForm({
  validationSchema: schema,
  initialValues: {
    name: "",
    category_id: -1, // default select value
  },
})

const { value: name } = useField<string>("name")
const { value: category_id } = useField<number>("category_id")

// State
const categories = ref<Category[]>([])

// Fetch categories
const fetchCategories = async () => {
  try {
    categories.value = await $fetch<Category[]>("/api/categories")
  } catch (err: any) {
    errorMsg.value = err?.statusMessage || "Failed to load categories"
  }
}

onMounted(fetchCategories)

// Submit
const onSubmit = handleSubmit(async (values) => {

  try {
    const product = await $fetch<{ id: number }>("/api/products", {
      method: "POST",
      body: values,
    })

    // set success message
    successMsg.value = "Product created successfully!";

    // navigate to edit page
    await navigateTo(`/dashboard/products/${product.id}`);

    resetForm()

  } catch (err: any) {
    errorMsg.value = err?.statusMessage || "Failed to create product"
  }
})
</script>

<template>
  <div class="p-4 max-w-lg">
    <h1 class="text-xl font-bold gradient-text mb-4">Create Product</h1>

    <!-- Error -->
    <div v-if="errorMsg" class="mb-3 p-2 rounded bg-red-500/20 text-red-300 text-sm">
      {{ errorMsg }}
    </div>

    <form @submit.prevent="onSubmit" class="space-y-3">
      <!-- Name -->
      <div>
        <input v-model="name" type="text" placeholder="Product name"
          :class="[
            'w-full p-2 rounded-lg border bg-gray-900/50 text-gray-100 placeholder-gray-400 focus:outline-none transition',
            errors.name
              ? 'border-red-500 focus:ring-2 focus:ring-red-500'
              : 'border-gray-700 focus:ring-2 focus:ring-emerald-500'
          ]" />
        <p v-if="errors.name" class="text-red-400 text-xs mt-1">{{ errors.name }}</p>
      </div>

      <!-- Category -->
      <div>
        <select v-model.number="category_id"
          :class="[
            'w-full p-2 rounded-lg border bg-gray-900/50 text-gray-100 focus:outline-none transition',
            errors.category_id
              ? 'border-red-500 focus:ring-2 focus:ring-red-500'
              : 'border-gray-700 focus:ring-2 focus:ring-emerald-500'
          ]">
          <option value="-1">-- Select category --</option>
          <option v-for="c in categories" :key="c.id" :value="c.id">{{ c.name }}</option>
        </select>
        <p v-if="errors.category_id" class="text-red-400 text-xs mt-1">{{ errors.category_id }}</p>
      </div>

      <!-- Submit -->
      <button type="submit" :disabled="isSubmitting"
        class="w-full py-2 rounded-lg font-medium bg-emerald-600 hover:bg-emerald-700 transition-transform hover:scale-105 shadow-lg shadow-emerald-900/20 disabled:opacity-50 flex items-center justify-center gap-2">
        <span v-if="!isSubmitting">Create</span>
        <span v-else class="flex items-center gap-2">
          <Icon icon="svg-spinners:180-ring-with-bg" class="w-5 h-5 animate-spin" />
          Creating...
        </span>
      </button>
    </form>
  </div>
</template>

