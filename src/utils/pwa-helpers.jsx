"use client"

/**
 * Utilidades para trabajar con características de PWA
 */

const DB_NAME = "pwa-app-db"
const DB_VERSION = 3 // Incrementamos la versión para forzar recreación

let dbInstance = null

/**
 * Inicializa la base de datos con manejo robusto de errores
 */
const initDB = () => {
  return new Promise((resolve, reject) => {
    if (dbInstance) {
      resolve(dbInstance)
      return
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onerror = () => {
      console.error("Error al abrir IndexedDB:", request.error)
      reject(request.error)
    }

    request.onupgradeneeded = (event) => {
      const db = event.target.result
      console.log("Actualizando estructura de IndexedDB...")

      // Eliminar stores existentes si existen (para recrear)
      const existingStores = Array.from(db.objectStoreNames)
      existingStores.forEach((storeName) => {
        if (db.objectStoreNames.contains(storeName)) {
          db.deleteObjectStore(storeName)
          console.log(`Object store '${storeName}' eliminado`)
        }
      })

      // Crear object stores necesarios
      const storeNames = ["users", "propietarios", "syncRequests", "cache"]

      storeNames.forEach((storeName) => {
        const store = db.createObjectStore(storeName, { keyPath: "id" })
        console.log(`Object store '${storeName}' creado`)

        // Crear índices específicos para syncRequests
        if (storeName === "syncRequests") {
          store.createIndex("timestamp", "timestamp", { unique: false })
          store.createIndex("attempts", "attempts", { unique: false })
          store.createIndex("endpoint", "endpoint", { unique: false })
        }

        // Crear índices para users
        if (storeName === "users") {
          store.createIndex("timestamp", "timestamp", { unique: false })
        }

        // Crear índices para propietarios
        if (storeName === "propietarios") {
          store.createIndex("timestamp", "timestamp", { unique: false })
        }
      })
    }

    request.onsuccess = () => {
      dbInstance = request.result
      console.log("IndexedDB inicializada correctamente con stores:", Array.from(dbInstance.objectStoreNames))
      resolve(dbInstance)
    }

    request.onblocked = () => {
      console.warn("IndexedDB bloqueada, cerrando conexiones existentes...")
      if (dbInstance) {
        dbInstance.close()
        dbInstance = null
      }
    }
  })
}

/**
 * Verifica si un store existe en la base de datos
 */
const storeExists = async (storeName) => {
  try {
    const db = await initDB()
    return db.objectStoreNames.contains(storeName)
  } catch (error) {
    console.error("Error verificando store:", error)
    return false
  }
}

/**
 * Guarda datos en IndexedDB para uso offline
 */
export async function saveToIndexedDB(storeName, data, key) {
  try {
    const db = await initDB()

    // Verificar que el store existe
    if (!db.objectStoreNames.contains(storeName)) {
      console.error(`Store '${storeName}' no existe en la base de datos`)
      return false
    }

    return new Promise((resolve, reject) => {
      try {
        const transaction = db.transaction(storeName, "readwrite")
        const store = transaction.objectStore(storeName)

        const addRequest = store.put(data)

        addRequest.onsuccess = () => {
          console.log(`Datos guardados en IndexedDB store: ${storeName}`)
          resolve(true)
        }

        addRequest.onerror = () => {
          console.error(`Error al guardar en store ${storeName}:`, addRequest.error)
          reject(addRequest.error)
        }

        transaction.onerror = () => {
          console.error(`Error en transacción para store ${storeName}:`, transaction.error)
          reject(transaction.error)
        }
      } catch (error) {
        console.error(`Error creando transacción para ${storeName}:`, error)
        reject(error)
      }
    })
  } catch (error) {
    console.error(`Error al guardar en IndexedDB (${storeName}):`, error)
    return false
  }
}

/**
 * Recupera datos de IndexedDB
 */
export async function getFromIndexedDB(storeName, key) {
  try {
    const db = await initDB()

    // Verificar que el store existe
    if (!db.objectStoreNames.contains(storeName)) {
      console.error(`Store '${storeName}' no existe en la base de datos`)
      return null
    }

    return new Promise((resolve, reject) => {
      try {
        const transaction = db.transaction(storeName, "readonly")
        const store = transaction.objectStore(storeName)

        let getRequest

        if (key !== undefined) {
          // Obtener un objeto específico
          getRequest = store.get(key)
        } else {
          // Obtener todos los objetos
          getRequest = store.getAll()
        }

        getRequest.onsuccess = () => {
          resolve(getRequest.result)
        }

        getRequest.onerror = () => {
          console.error(`Error al recuperar de store ${storeName}:`, getRequest.error)
          reject(getRequest.error)
        }

        transaction.onerror = () => {
          console.error(`Error en transacción para store ${storeName}:`, transaction.error)
          reject(transaction.error)
        }
      } catch (error) {
        console.error(`Error creando transacción para ${storeName}:`, error)
        reject(error)
      }
    })
  } catch (error) {
    console.error(`Error al acceder a IndexedDB (${storeName}):`, error)
    return null
  }
}

/**
 * Elimina datos de IndexedDB
 */
export async function removeFromIndexedDB(storeName, key) {
  try {
    const db = await initDB()

    // Verificar que el store existe
    if (!db.objectStoreNames.contains(storeName)) {
      console.error(`Store '${storeName}' no existe en la base de datos`)
      return false
    }

    return new Promise((resolve, reject) => {
      try {
        const transaction = db.transaction(storeName, "readwrite")
        const store = transaction.objectStore(storeName)

        const deleteRequest = store.delete(key)

        deleteRequest.onsuccess = () => {
          console.log(`Datos eliminados de IndexedDB store: ${storeName}`)
          resolve(true)
        }

        deleteRequest.onerror = () => {
          console.error(`Error al eliminar de store ${storeName}:`, deleteRequest.error)
          reject(deleteRequest.error)
        }

        transaction.onerror = () => {
          console.error(`Error en transacción para store ${storeName}:`, transaction.error)
          reject(transaction.error)
        }
      } catch (error) {
        console.error(`Error creando transacción para ${storeName}:`, error)
        reject(error)
      }
    })
  } catch (error) {
    console.error(`Error al eliminar de IndexedDB (${storeName}):`, error)
    return false
  }
}

/**
 * Registra una solicitud para sincronización en segundo plano
 */
export async function registerSyncRequest(endpoint, method, data) {
  try {
    // Guardar la solicitud en IndexedDB
    const syncRequest = {
      id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      endpoint,
      method,
      data,
      timestamp: Date.now(),
      attempts: 0,
    }

    const saved = await saveToIndexedDB("syncRequests", syncRequest)

    if (!saved) {
      console.error("No se pudo guardar la solicitud de sincronización")
      return false
    }

    // Actualizar contador de solicitudes pendientes
    const pendingCount = localStorage.getItem("pendingRequestsCount")
    const newCount = pendingCount ? Number.parseInt(pendingCount, 10) + 1 : 1
    localStorage.setItem("pendingRequestsCount", newCount.toString())

    // Intentar registrar Background Sync solo si está disponible y permitido
    if (await isBackgroundSyncSupported()) {
      try {
        const registration = await navigator.serviceWorker.ready
        const syncManager = registration.sync

        if (syncManager) {
          await syncManager.register("sync-requests")
          console.log("Background Sync registrado exitosamente")
        }
      } catch (error) {
        // No es crítico si falla Background Sync, la sincronización manual funcionará
        console.log("Background Sync no disponible, usando sincronización manual:", error.message)
      }
    }

    return true
  } catch (error) {
    console.error("Error al registrar solicitud para sincronización:", error)
    return false
  }
}

/**
 * Verifica si la aplicación está instalada como PWA
 */
export function isAppInstalled() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    window.navigator.standalone === true ||
    document.referrer.includes("android-app://")
  )
}

/**
 * Verifica si el navegador soporta características de PWA
 */
export function getPWASupport() {
  return {
    serviceWorker: "serviceWorker" in navigator,
    caches: "caches" in window,
    indexedDB: "indexedDB" in window,
    pushManager: "PushManager" in window,
    backgroundSync: "SyncManager" in window && "serviceWorker" in navigator,
    notifications: "Notification" in window,
    installPrompt: "BeforeInstallPromptEvent" in window,
  }
}

/**
 * Procesa las solicitudes pendientes de sincronización
 */
export async function processPendingSyncRequests() {
  try {
    // Verificar que el store existe antes de intentar acceder
    if (!(await storeExists("syncRequests"))) {
      console.log("Store syncRequests no existe, inicializando...")
      await initDB()
      return { processed: 0, failed: 0 }
    }

    const pendingRequests = await getFromIndexedDB("syncRequests")

    if (!pendingRequests || pendingRequests.length === 0) {
      console.log("No hay solicitudes pendientes para procesar")
      return { processed: 0, failed: 0 }
    }

    let processed = 0
    let failed = 0

    console.log(`Procesando ${pendingRequests.length} solicitudes pendientes`)

    for (const request of pendingRequests) {
      try {
        const response = await fetch(request.endpoint, {
          method: request.method,
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: request.data ? JSON.stringify(request.data) : undefined,
        })

        if (response.ok) {
          // Eliminar la solicitud procesada
          await removeFromIndexedDB("syncRequests", request.id)
          processed++
          console.log(`Solicitud ${request.id} procesada exitosamente`)
        } else {
          // Incrementar intentos fallidos
          request.attempts = (request.attempts || 0) + 1

          // Si ha fallado muchas veces, eliminar la solicitud
          if (request.attempts >= 3) {
            await removeFromIndexedDB("syncRequests", request.id)
            failed++
            console.log(`Solicitud ${request.id} eliminada después de 3 intentos fallidos`)
          } else {
            // Actualizar la solicitud con el nuevo número de intentos
            await saveToIndexedDB("syncRequests", request)
            console.log(`Solicitud ${request.id} falló, reintento ${request.attempts}/3`)
          }
        }
      } catch (error) {
        console.error(`Error al procesar solicitud ${request.id}:`, error)

        // Incrementar intentos en caso de error de red
        request.attempts = (request.attempts || 0) + 1
        if (request.attempts >= 3) {
          await removeFromIndexedDB("syncRequests", request.id)
          failed++
        } else {
          await saveToIndexedDB("syncRequests", request)
        }
      }
    }

    // Actualizar contador de solicitudes pendientes
    const remainingRequests = await getFromIndexedDB("syncRequests")
    const remainingCount = remainingRequests ? remainingRequests.length : 0
    localStorage.setItem("pendingRequestsCount", remainingCount.toString())

    console.log(`Sincronización completada: ${processed} procesadas, ${failed} fallidas, ${remainingCount} restantes`)
    return { processed, failed }
  } catch (error) {
    console.error("Error al procesar solicitudes pendientes:", error)
    return { processed: 0, failed: 0 }
  }
}

/**
 * Registra un listener para eventos de sincronización del service worker
 */
export function setupSyncEventListener() {
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.addEventListener("message", async (event) => {
      if (event.data && event.data.type === "BACKGROUND_SYNC") {
        console.log("Evento de sincronización recibido:", event.data.tag)

        // Procesar solicitudes pendientes
        const result = await processPendingSyncRequests()

        console.log(`Sincronización completada: ${result.processed} procesadas, ${result.failed} fallidas`)

        // Notificar al service worker que la sincronización está completa
        if (navigator.serviceWorker.controller) {
          navigator.serviceWorker.controller.postMessage({
            type: "SYNC_COMPLETED",
            processed: result.processed,
            failed: result.failed,
          })
        }
      }
    })
  }
}

/**
 * Inicializa el sistema de sincronización en segundo plano
 */
export function initializeBackgroundSync() {
  // Inicializar la base de datos primero
  initDB()
    .then(() => {
      console.log("Base de datos inicializada para Background Sync")

      setupSyncEventListener()

      // Procesar solicitudes pendientes cuando la app se carga
      if (navigator.onLine) {
        processPendingSyncRequests()
      }

      // Procesar solicitudes cuando vuelve la conexión
      window.addEventListener("online", () => {
        console.log("Conexión restaurada, procesando solicitudes pendientes...")
        processPendingSyncRequests()
      })
    })
    .catch((error) => {
      console.error("Error inicializando Background Sync:", error)
    })
}

/**
 * Verifica si Background Sync está disponible y permitido
 */
export async function isBackgroundSyncSupported() {
  if (!("serviceWorker" in navigator) || !("SyncManager" in window)) {
    return false
  }

  try {
    const registration = await navigator.serviceWorker.ready
    return !!registration.sync
  } catch (error) {
    console.log("Background Sync no está disponible:", error.message)
    return false
  }
}

/**
 * Función para limpiar la base de datos
 */
export async function clearIndexedDB() {
  try {
    const db = await initDB()
    const storeNames = ["users", "propietarios", "syncRequests", "cache"]

    return new Promise((resolve, reject) => {
      try {
        const transaction = db.transaction(storeNames, "readwrite")

        storeNames.forEach((storeName) => {
          if (db.objectStoreNames.contains(storeName)) {
            const store = transaction.objectStore(storeName)
            store.clear()
            console.log(`Store ${storeName} limpiado`)
          }
        })

        transaction.oncomplete = () => {
          console.log("IndexedDB limpiada correctamente")
          resolve(true)
        }

        transaction.onerror = () => {
          console.error("Error al limpiar IndexedDB:", transaction.error)
          reject(transaction.error)
        }
      } catch (error) {
        console.error("Error creando transacción para limpiar:", error)
        reject(error)
      }
    })
  } catch (error) {
    console.error("Error al limpiar IndexedDB:", error)
    return false
  }
}

// Función de compatibilidad para mantener la API anterior
export const processPendingRequests = processPendingSyncRequests
