<script>
  export let text = ''
  export let type = 'default'
</script>

<div class:error={type === 'error'} class:success={type === 'success'} class="status">
  {text}
</div>

<style>
  .status {
    min-height: 18px;
    font-size: 12px;
  }

  .error {
    color: var(--error);
  }

  .success {
    color: var(--success);
  }
</style>
