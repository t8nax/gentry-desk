import { defineStore } from 'pinia'
import { shallowRef } from 'vue'

export const useAppStore = defineStore('app', () => {
  /** Сколько рабочих копий ждут оператора: считает раздел копий, показывает сайдбар. */
  const waitingCount = shallowRef(0)

  function setWaitingCount(count: number) {
    waitingCount.value = count
  }

  return {
    waitingCount,
    setWaitingCount,
  }
})
