"use client"

/**
 * Utilidades para trabajar con características de PWA
 */

/**
 * Guarda datos en IndexedDB para uso offline
 */
export async function saveToIndexedDB(storeName, data, key) {
  return new Promise((resolve, reject) => {
    // Abrir o crear la base de datos
    const request = indexedDB.open("pwa-app-db", 1)

    request.onerror = () => reject(new Error("Error al abrir IndexedDB"))

    request.onupgradeneeded = (event) => {
      const db = event.target.result

      // Crear el almacén si no existe
      if (!db.objectStoreNames.contains(storeName)) {
        db.createObjectStore(storeName, { keyPath: key || "id" })
      }
    }

    request.onsuccess = (event) => {
      const db = event.target.result

      try {
        const transaction = db.transaction(storeName, "readwrite")
        const store = transaction.objectStore(storeName)

        const addRequest = store.put(data)

        addRequest.onsuccess = () => {
          resolve(true)
        }

        addRequest.onerror = () => {
          reject(new Error("Error al guardar datos en IndexedDB"))
        }

        transaction.oncomplete = () => {
          db.close()
        }
      } catch (error) {
        reject(error)
      }
    }
  })
}

/**
 * Recupera datos de IndexedDB
 */
export async function getFromIndexedDB(storeName, key) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("pwa-app-db", 1)

    request.onerror = () => reject(new Error("Error al abrir IndexedDB"))

    request.onsuccess = (event) => {
      const db = event.target.result

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
          reject(new Error("Error al recuperar datos de IndexedDB"))
        }

        transaction.oncomplete = () => {
          db.close()
        }
      } catch (error) {
        reject(error)
      }
    }
  })
}

/**
 * Elimina datos de IndexedDB
 */
export async function removeFromIndexedDB(storeName, key) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("pwa-app-db", 1)

    request.onerror = () => reject(new Error("Error al abrir IndexedDB"))

    request.onsuccess = (event) => {
      const db = event.target.result

      try {
        const transaction = db.transaction(storeName, "readwrite")
        const store = transaction.objectStore(storeName)

        const deleteRequest = store.delete(key)

        deleteRequest.onsuccess = () => {
          resolve(true)
        }

        deleteRequest.onerror = () => {
          reject(new Error("Error al eliminar datos de IndexedDB"))
        }

        transaction.oncomplete = () => {
          db.close()
        }
      } catch (error) {
        reject(error)
      }
    }
  })
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

    await saveToIndexedDB("syncRequests", syncRequest)

    // Actualizar contador de solicitudes pendientes
    const pendingCount = localStorage.getItem("pendingRequestsCount")
    const newCount = pendingCount ? Number.parseInt(pendingCount, 10) + 1 : 1
    localStorage.setItem("pendingRequestsCount", newCount.toString())

    // Registrar tarea de sincronización si el navegador lo soporta
    if ("serviceWorker" in navigator && "SyncManager" in window) {
      try {
        const registration = await navigator.serviceWorker.ready

        // Usar notación de corchetes para evitar errores de TypeScript
        const syncManager = registration["sync"]

        if (syncManager) {
          await syncManager["register"]("sync-requests")
        }
      } catch (error) {
        console.log("No se pudo registrar background sync, pero la solicitud se guardó para sincronización manual")
      }
    }
  } catch (error) {
    console.error("Error al registrar solicitud para sincronización:", error)
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
    const pendingRequests = await getFromIndexedDB("syncRequests")

    if (!pendingRequests || pendingRequests.length === 0) {
      return { processed: 0, failed: 0 }
    }

    let processed = 0
    let failed = 0

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
        } else {
          // Incrementar intentos fallidos
          request.attempts = (request.attempts || 0) + 1

          // Si ha fallado muchas veces, eliminar la solicitud
          if (request.attempts >= 3) {
            await removeFromIndexedDB("syncRequests", request.id)
            failed++
          } else {
            // Actualizar la solicitud con el nuevo número de intentos
            await saveToIndexedDB("syncRequests", request)
          }
        }
      } catch (error) {
        console.error("Error al procesar solicitud de sync:", error)
        failed++
      }
    }

    // Actualizar contador de solicitudes pendientes
    const remainingRequests = await getFromIndexedDB("syncRequests")
    const remainingCount = remainingRequests ? remainingRequests.length : 0
    localStorage.setItem("pendingRequestsCount", remainingCount.toString())

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
  setupSyncEventListener()

  // Procesar solicitudes pendientes cuando la app se carga
  if (navigator.onLine) {
    processPendingSyncRequests()
  }

  // Procesar solicitudes cuando vuelve la conexión
  window.addEventListener("online", () => {
    processPendingSyncRequests()
  })
}

/**
 * Verifica si Background Sync está disponible
 */
export async function isBackgroundSyncSupported() {
  if (!("serviceWorker" in navigator) || !("SyncManager" in window)) {
    return false
  }

  try {
    const registration = await navigator.serviceWorker.ready
    // Usar notación de corchetes para evitar errores de TypeScript
    return !!registration["sync"]
  } catch (error) {
    return false
  }
}
