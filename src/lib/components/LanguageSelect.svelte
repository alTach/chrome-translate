<script>
  import { createEventDispatcher } from 'svelte'

  export let options = []
  export let value = ''
  // export let muted = false
  export let label = ''

  const dispatch = createEventDispatcher()
</script>

<label class="app-field">
  {#if label}
    <span class="app-label">{label}</span>
  {/if}
  <select
    class="app-select-inline"
    bind:value
    on:change={() => dispatch('change', value)}
  >
    {#each options as option}
      <option value={option.code}>{option.label}</option>
    {/each}
  </select>
</label>
