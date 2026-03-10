<script setup lang="ts">
definePageMeta({ layout: "dashboard", requiresAuth: true })

import { ref, computed, onMounted, watch } from "vue"
import { useRouter } from "vue-router"
import { useMessage } from "~/composables/useMessage"

const router = useRouter()
const { errorMsg, successMsg } = useMessage()

// --------------------
// Types
// --------------------
type Category = { id: number; name: string }
type Product = { id: number; name: string; category: Category }
type PaginatedProducts = {
  current_page: number
  data: Product[]
  last_page: number
  per_page: number
  total: number
}

// --------------------
// State
// --------------------
const products = ref<Product[]>([])
const loading = ref(false)
const searchInput = ref("")
const searchQuery = ref("")
const page = ref(1)
const perPage = 5
const total = ref(0)
const lastPageValue = ref(1)

// --------------------
// Fetch products
// --------------------
const fetchProducts = async () => {
  loading.value = true
  errorMsg.value = null

  try {
    const res = await $fetch<PaginatedProducts>("/api/products", {
      method: "GET",
      query: { q: searchQuery.value, page: page.value, perPage },
    })

    products.value = res.data
    total.value = res.total
    lastPageValue.value = res.last_page
  } catch (err: any) {
    errorMsg.value = err?.statusMessage || "Failed to fetch products"
    products.value = []
    total.value = 0
    lastPageValue.value = 1
  } finally {
    loading.value = false
  }
}

// Fetch on page load
onMounted(fetchProducts)

// --------------------
// Computed
// --------------------
const paginated = computed(() => products.value)

// --------------------
// Search (with debounce)
// --------------------
let debounceTimeout: ReturnType<typeof setTimeout> | null = null
watch(searchInput, (val) => {
  if (debounceTimeout) clearTimeout(debounceTimeout)
  debounceTimeout = setTimeout(() => {
    searchQuery.value = val
    page.value = 1
    fetchProducts()
  }, 400)
})

// --------------------
// Pagination
// --------------------
const prevPage = () => {
  if (page.value > 1) {
    page.value--
    fetchProducts()
  }
}
const nextPage = () => {
  if (page.value < lastPageValue.value) {
    page.value++
    fetchProducts()
  }
}

// --------------------
// Edit & Delete
// --------------------
const editProduct = (id: number) => router.push(`/dashboard/products/${id}`)

// --------------------
// Modal Delete
// --------------------
const showDeleteModal = ref(false)
const productToDelete = ref<Product | null>(null)

const openDeleteModal = (product: Product) => {
  productToDelete.value = product
  showDeleteModal.value = true
}

const confirmDelete = async () => {
  if (!productToDelete.value) return

  try {
    await $fetch(`/api/products/${productToDelete.value.id}`, { method: "DELETE" })
    successMsg.value = "Product deleted successfully!"
    showDeleteModal.value = false
    productToDelete.value = null
    fetchProducts()
  } catch (err: any) {
    errorMsg.value = err?.statusMessage || "Failed to delete product"
    showDeleteModal.value = false
    productToDelete.value = null
  }
}

const cancelDelete = () => {
  showDeleteModal.value = false
  productToDelete.value = null
}
</script>

<template>
  <div class="p-4 min-h-screen bg-[#0f172a] text-gray-100">
    <div class="bg-gray-800/40 backdrop-blur-md border border-gray-700/50 rounded-2xl p-6 shadow-lg shadow-emerald-900/20">

      <!-- Header -->
      <div class="flex items-center justify-between mb-6">
        <h1 class="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 via-blue-500 to-purple-500">
          Products
        </h1>
      </div>

      <!-- Error -->
      <div v-if="errorMsg" class="mb-4 p-2 rounded bg-red-500/20 text-red-300 text-sm">
        {{ errorMsg }}
      </div>

      <!-- Search -->
      <div class="flex gap-2 mb-6">
        <input
          v-model="searchInput"
          type="text"
          placeholder="Search products..."
          class="flex-1 p-2.5 rounded-lg border border-gray-700 bg-gray-900/60 text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
        />
      </div>

      <!-- Loading -->
      <div v-if="loading" class="text-center text-gray-400 py-6">Loading...</div>

      <!-- Products Table -->
      <div v-else class="overflow-x-auto">
        <table class="w-full border-collapse">
          <thead>
            <tr class="text-left text-gray-300 border-b border-gray-700">
              <th class="py-3 px-3 text-sm font-semibold">#</th>
              <th class="py-3 px-3 text-sm font-semibold">Name</th>
              <th class="py-3 px-3 text-sm font-semibold">Category</th>
              <th class="py-3 px-3 text-sm font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(p, i) in paginated" :key="p.id" class="border-b border-gray-700/50 hover:bg-gray-700/20 transition">
              <td class="py-3 px-3 text-sm text-gray-400">{{ (page - 1) * perPage + i + 1 }}</td>
              <td class="py-3 px-3 font-medium">{{ p.name }}</td>
              <td class="py-3 px-3 text-gray-400">{{ p.category?.name || "-" }}</td>
              <td class="py-3 px-3 text-right space-x-2">
                <button
                  @click="editProduct(p.id)"
                  class="px-2 py-1 rounded bg-blue-600 hover:bg-blue-700 text-white text-sm"
                >
                  Edit
                </button>
                <button
                  @click="openDeleteModal(p)"
                  class="px-2 py-1 rounded bg-red-600 hover:bg-red-700 text-white text-sm"
                >
                  Delete
                </button>
              </td>
            </tr>

            <tr v-if="paginated.length === 0">
              <td colspan="4" class="text-center py-6 text-gray-400">No products found.</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div class="mt-6 flex items-center justify-between">
        <button
          @click="prevPage"
          :disabled="page === 1"
          class="px-4 py-2 rounded-lg border border-gray-700 bg-gray-900/60 disabled:opacity-50 hover:bg-gray-700/40 transition"
        >
          Prev
        </button>

        <span class="text-sm text-gray-400">
          Page {{ page }} / {{ lastPageValue }}
        </span>

        <button
          @click="nextPage"
          :disabled="page === lastPageValue"
          class="px-4 py-2 rounded-lg border border-gray-700 bg-gray-900/60 disabled:opacity-50 hover:bg-gray-700/40 transition"
        >
          Next
        </button>
      </div>
    </div>
  </div>

  <!-- Delete Modal -->
  <div v-if="showDeleteModal" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
    <div class="bg-gray-800 rounded-xl p-6 w-96 shadow-lg">
      <h2 class="text-md mb-4 text-red-500">Confirm Delete</h2>
      <p class="text-sm text-gray-200 mb-6">
        Are you sure you want to delete
        <span>{{ productToDelete?.name }}</span>?
        This action cannot be undone.
      </p>
      <div class="flex justify-end gap-3">
        <button
          @click="cancelDelete"
          class="text-sm px-4 py-2 rounded-lg bg-gray-600 hover:bg-gray-700 text-gray-100 transition"
        >
          Cancel
        </button>
        <button
          @click="confirmDelete"
          class="text-sm px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white transition"
        >
          Delete
        </button>
      </div>
    </div>
  </div>
</template>
