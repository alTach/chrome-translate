<script>
  export let text = ''
  export let type = 'default'
</script>

{#if text}
  <div  class:status--error={type === 'error'} class:status--success={type === 'success'} class="status">
    {text}
  </div>
{/if}
