<template>
  <span class="typed-text">{{ typeValue }}</span>
  <span class="blinking-cursor" :style="{ color: cursorColor }">|</span>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

interface RotatingTextProps {
  /**
   * Array of texts to display in rotation
   */
  displayTextArray: string[]
  /**
   * Speed of typing in milliseconds
   */
  typingSpeed?: number
  /**
   * Speed of erasing in milliseconds
   */
  erasingSpeed?: number
  /**
   * Delay before typing a new text in milliseconds
   */
  newTextDelay?: number
  /**
   * Cursor color
   */
  cursorColor?: string
}

const props = withDefaults(defineProps<RotatingTextProps>(), {
  typingSpeed: 100,
  erasingSpeed: 100,
  newTextDelay: 2000,
  cursorColor: '#2c3e50',
})

const typeValue = ref('')
const typeStatus = ref(false)
const displayTextArrayIndex = ref(0)
const charIndex = ref(0)

const typeText = () => {
  if (charIndex.value < props.displayTextArray[displayTextArrayIndex.value].length) {
    if (!typeStatus.value) typeStatus.value = true
    typeValue.value += props.displayTextArray[displayTextArrayIndex.value].charAt(charIndex.value)
    charIndex.value += 1
    setTimeout(typeText, props.typingSpeed)
  } else {
    typeStatus.value = false
    setTimeout(eraseText, props.newTextDelay)
  }
}

const eraseText = () => {
  if (charIndex.value > 0) {
    if (!typeStatus.value) typeStatus.value = true
    typeValue.value = props.displayTextArray[displayTextArrayIndex.value].substring(
      0,
      charIndex.value - 1,
    )
    charIndex.value -= 1
    setTimeout(eraseText, props.erasingSpeed)
  } else {
    typeStatus.value = false
    displayTextArrayIndex.value += 1
    if (displayTextArrayIndex.value >= props.displayTextArray.length)
      displayTextArrayIndex.value = 0
    setTimeout(typeText, props.typingSpeed + 1000)
  }
}

onMounted(() => {
  setTimeout(typeText, props.newTextDelay + 200)
})
</script>

<style lang="scss" scoped>
.blinking-cursor {
  // font-weight: bold;
  font-size: 1.1em;
  margin-left: 2px;
  -webkit-animation: 1s blink step-end infinite;
  -moz-animation: 1s blink step-end infinite;
  -ms-animation: 1s blink step-end infinite;
  -o-animation: 1s blink step-end infinite;
  animation: 1s blink step-end infinite;
}
/* Fixed keyframes that properly toggle visibility instead of opacity */
@keyframes blink {
  from,
  to {
    opacity: 0;
  }
  50% {
    opacity: 1;
  }
}
@-moz-keyframes blink {
  from,
  to {
    opacity: 0;
  }
  50% {
    opacity: 1;
  }
}
@-webkit-keyframes blink {
  from,
  to {
    opacity: 0;
  }
  50% {
    opacity: 1;
  }
}
@-ms-keyframes blink {
  from,
  to {
    opacity: 0;
  }
  50% {
    opacity: 1;
  }
}
@-o-keyframes blink {
  from,
  to {
    opacity: 0;
  }
  50% {
    opacity: 1;
  }
}
</style>
