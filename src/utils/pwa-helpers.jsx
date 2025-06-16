"use client"
import { openDB } from "idb"
import { useState, useEffect } from "react"
import { Wifi, WifiOff, BoxIcon as Button, RefreshCw } from "lucide-react"

/**
 * Utilidades para trabajar con características de PWA
 */

const DB_NAME = "agua-pinos-pwa"
const DB_VERSION = 1 // Incrementamos la versión para forzar recreación

/**
 * Inicializa la base de datos con manejo robusto de errores
 */
export const initDB = async () => {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      // Almacén para cargas de agua
      if (!db.objectStoreNames.contains("cargas")) {
        db.createObjectStore("cargas", { keyPath: "id" })
      }

      // Almacén para pagos
      if (!db.objectStoreNames.contains("pagos")) {
        db.createObjectStore("pagos", { keyPath: "id" })
      }

      // Almacén para conductores
      if (!db.objectStoreNames.contains("conductores")) {
        db.createObjectStore("conductores", { keyPath: "id" })
      }

      // Almacén para usuarios
      if (!db.objectStoreNames.contains("usuarios")) {
        db.createObjectStore("usuarios", { keyPath: "id" })
      }

      // Almacén para datos del dashboard
      if (!db.objectStoreNames.contains("dashboard")) {
        db.createObjectStore("dashboard", { keyPath: "id" })
      }

      // Almacén para perfil de usuario
      if (!db.objectStoreNames.contains("perfil")) {
        db.createObjectStore("perfil", { keyPath: "id" })
      }

      // Cola de sincronización para operaciones pendientes
      if (!db.objectStoreNames.contains("syncQueue")) {
        db.createObjectStore("syncQueue", { keyPath: "id", autoIncrement: true })
      }

      // Almacén para solicitudes de sincronización
      if (!db.objectStoreNames.contains("syncRequests")) {
        db.createObjectStore("syncRequests", { keyPath: "id" })
      }
    },
  })
}

/**
 * Guarda datos en IndexedDB para uso offline
 */
export async function saveToIndexedDB(storeName, data) {
  try {
    const db = await initDB()
    const tx = db.transaction(storeName, "readwrite")
    const store = tx.objectStore(storeName)
    await store.put(data)
    await tx.done
    return true
  } catch (error) {
    console.error(`Error al guardar en ${storeName}:`, error)
    return false
  }
}

/**
 * Recupera datos de IndexedDB
 */
export async function getFromIndexedDB(storeName, id) {
  try {
    const db = await initDB()
    const tx = db.transaction(storeName, "readonly")
    const store = tx.objectStore(storeName)
    const result = await store.get(id)
    await tx.done
    return result
  } catch (error) {
    console.error(`Error al obtener de ${storeName}:`, error)
    return null
  }
}

/**
 * Obtener todos los datos de un almacén
 */
export const getAllFromIndexedDB = async (storeName) => {
  try {
    const db = await initDB()
    const tx = db.transaction(storeName, "readonly")
    const store = tx.objectStore(storeName)
    const result = await store.getAll()
    await tx.done
    return result
  } catch (error) {
    console.error(`Error al obtener todos de ${storeName}:`, error)
    return []
  }
}

/**
 * Elimina datos de IndexedDB
 */
export async function removeFromIndexedDB(storeName, id) {
  try {
    const db = await initDB()
    const tx = db.transaction(storeName, "readwrite")
    const store = tx.objectStore(storeName)
    await store.delete(id)
    await tx.done
    return true
  } catch (error) {
    console.error(`Error al eliminar de ${storeName}:`, error)
    return false
  }
}

/**
 * Añadir operación a la cola de sincronización
 */
export const addToSyncQueue = async (operation) => {
  try {
    const db = await initDB()
    const tx = db.transaction("syncQueue", "readwrite")
    const store = tx.objectStore("syncQueue")

    // Añadir timestamp y estado
    const syncOperation = {
      ...operation,
      timestamp: Date.now(),
      status: "pending",
      retries: 0,
    }

    await store.add(syncOperation)
    await tx.done
    return true
  } catch (error) {
    console.error("Error al añadir a la cola de sincronización:", error)
    return false
  }
}

/**
 * Obtener operaciones pendientes de la cola de sincronización
 */
export const getPendingSyncOperations = async () => {
  try {
    const db = await initDB()
    const tx = db.transaction("syncQueue", "readonly")
    const store = tx.objectStore("syncQueue")
    const operations = await store.getAll()
    await tx.done
    return operations.filter((op) => op.status === "pending")
  } catch (error) {
    console.error("Error al obtener operaciones pendientes:", error)
    return []
  }
}

/**
 * Actualizar estado de una operación en la cola de sincronización
 */
export const updateSyncOperation = async (id, updates) => {
  try {
    const db = await initDB()
    const tx = db.transaction("syncQueue", "readwrite")
    const store = tx.objectStore("syncQueue")

    const operation = await store.get(id)
    if (!operation) return false

    const updatedOperation = { ...operation, ...updates }
    await store.put(updatedOperation)
    await tx.done
    return true
  } catch (error) {
    console.error("Error al actualizar operación de sincronización:", error)
    return false
  }
}

/**
 * Limpiar operaciones completadas o fallidas (más antiguas que maxAge en ms)
 */
export const cleanupSyncQueue = async (maxAge = 7 * 24 * 60 * 60 * 1000) => {
  // 7 días por defecto
  try {
    const db = await initDB()
    const tx = db.transaction("syncQueue", "readwrite")
    const store = tx.objectStore("syncQueue")

    const operations = await store.getAll()
    const now = Date.now()

    for (const op of operations) {
      if (op.status !== "pending" && now - op.timestamp > maxAge) {
        await store.delete(op.id)
      }
    }

    await tx.done
    return true
  } catch (error) {
    console.error("Error al limpiar cola de sincronización:", error)
    return false
  }
}

/**
 * Verifica si hay conexión a internet
 */
export const isOnline = () => {
  return navigator.onLine
}

/**
 * Formatear fecha para mostrar
 */
export const formatDate = (dateString) => {
  return new Date(dateString).toLocaleString("es-ES", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

/**
 * Generar un ID único temporal para nuevos registros offline
 */
export const generateTempId = () => {
  return `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

/**
 * Sincronizar datos con el servidor cuando hay conexión
 */
export const syncWithServer = async () => {
  if (!isOnline()) return { success: false, message: "Sin conexión a internet" }

  try {
    const pendingOperations = await getPendingSyncOperations()

    if (pendingOperations.length === 0) {
      return { success: true, message: "No hay operaciones pendientes" }
    }

    let successCount = 0
    let failCount = 0

    for (const operation of pendingOperations) {
      try {
        // Procesar según el tipo de operación
        switch (operation.type) {
          case "CREATE_PAYMENT":
            // Implementar lógica para crear pago en el servidor
            await processPendingPayment(operation)
            break
          case "EXPORT_PDF":
            // Implementar lógica para exportar PDF
            await processPendingExport(operation)
            break
          case "UPDATE_PROFILE":
            // Implementar lógica para actualizar perfil
            await processPendingProfileUpdate(operation)
            break
          // Añadir más casos según sea necesario
        }

        // Marcar como completada
        await updateSyncOperation(operation.id, { status: "completed", syncedAt: Date.now() })
        successCount++
      } catch (error) {
        console.error(`Error al sincronizar operación ${operation.id}:`, error)

        // Incrementar contador de reintentos
        const retries = (operation.retries || 0) + 1
        const status = retries >= 3 ? "failed" : "pending"

        await updateSyncOperation(operation.id, {
          status,
          retries,
          lastError: error.message,
          lastAttempt: Date.now(),
        })

        failCount++
      }
    }

    return {
      success: successCount > 0,
      message: `Sincronización completada: ${successCount} exitosas, ${failCount} fallidas`,
    }
  } catch (error) {
    console.error("Error durante la sincronización:", error)
    return { success: false, message: `Error durante la sincronización: ${error.message}` }
  }
}

// Procesar pago pendiente
const processPendingPayment = async (operation) => {
  const { data } = operation

  const response = await fetch("https://zneeyt2ar7.execute-api.us-east-1.amazonaws.com/dev/pagoscargagua", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${localStorage.getItem("token")}`,
    },
    body: JSON.stringify(data),
  })

  if (!response.ok) {
    throw new Error(`Error al procesar pago: ${response.status}`)
  }

  return await response.json()
}

// Procesar exportación de PDF pendiente
const processPendingExport = async (operation) => {
  // Aquí implementaríamos la lógica para generar y descargar el PDF
  // Como esto normalmente ocurre en el cliente, podríamos mostrar una notificación
  return true
}

// Procesar actualización de perfil pendiente
const processPendingProfileUpdate = async (operation) => {
  const { data, userId } = operation

  const response = await fetch(`https://zneeyt2ar7.execute-api.us-east-1.amazonaws.com/dev/perfil/${userId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${localStorage.getItem("token")}`,
    },
    body: JSON.stringify(data),
  })

  if (!response.ok) {
    throw new Error(`Error al actualizar perfil: ${response.status}`)
  }

  return await response.json()
}

// Componente de estado de conexión PWA
export const PWAStatusBar = ({ pendingOperations = 0, onSync }) => {
  const [isConnected, setIsConnected] = useState(navigator.onLine)

  useEffect(() => {
    const handleOnline = () => setIsConnected(true)
    const handleOffline = () => setIsConnected(false)

    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)

    return () => {
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
    }
  }, [])

  return (
    <div
      className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm ${
        isConnected ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
      }`}
    >
      {isConnected ? <Wifi className="h-4 w-4" /> : <WifiOff className="h-4 w-4" />}
      {isConnected ? "En línea" : "Sin conexión"}

      {pendingOperations > 0 && (
        <>
          <span className="mx-1">•</span>
          <span className="text-amber-700">
            {pendingOperations} pendiente{pendingOperations !== 1 ? "s" : ""}
          </span>
          {isConnected && (
            <Button variant="ghost" size="sm" className="h-6 px-2 py-0 ml-1" onClick={onSync}>
              <RefreshCw className="h-3 w-3 mr-1" />
              Sincronizar
            </Button>
          )}
        </>
      )}
    </div>
  )
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

    const pendingRequests = await getAllFromIndexedDB("syncRequests")

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
    const remainingRequests = await getAllFromIndexedDB("syncRequests")
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
    const storeNames = [
      "users",
      "propietarios",
      "syncRequests",
      "cache",
      "cargas",
      "pagos",
      "conductores",
      "dashboard",
      "perfil",
    ]

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
