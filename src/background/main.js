chrome.commands.onCommand.addListener(async (command) => {
  if (command !== 'invoke-translation') {
    return
  }

  const [tab] = await chrome.tabs.query({
    active: true,
    currentWindow: true
  })

  if (!tab?.id) {
    return
  }

  try {
    await chrome.tabs.sendMessage(tab.id, { type: 'invoke-translation' })
  } catch {}
})
