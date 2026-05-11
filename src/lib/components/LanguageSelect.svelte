<script>
  import { createEventDispatcher } from 'svelte'

  export let options = []
  export let value = ''
  export let muted = false
  export let label = ''

  const dispatch = createEventDispatcher()
</script>

<label class="field">
  {#if label}
    <span>{label}</span>
  {/if}
  <select
    bind:value
    class:muted
    on:change={() => dispatch('change', value)}
  >
    {#each options as option}
      <option value={option.code}>{option.label}</option>
    {/each}
  </select>
</label>

<style>
  .field {
    display: grid;
    gap: 8px;
  }

  span {
    color: var(--muted);
    font-size: 12px;
  }

  select {
    width: 100%;
    border: 1px solid var(--line);
    background: #fff;
    color: var(--text);
    padding: 10px 12px;
    font: inherit;
    outline: none;
  }

  select:focus {
    border-color: var(--accent);
  }

  .muted {
    border: 0;
    padding: 0;
    color: var(--muted);
    width: auto;
  }
</style>
