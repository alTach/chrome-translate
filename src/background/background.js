function canInjectIntoTab(tab) {
  return Boolean(tab?.id && /^https?:\/\//i.test(tab.url || ''))
}

async function sendInvokeTranslation(tab) {
  await chrome.tabs.sendMessage(tab.id, { type: 'invoke-translation' })
}

async function injectContentScript(tab) {
  const [contentScript] = chrome.runtime.getManifest().content_scripts || []
  const files = contentScript?.js || []

  if (!files.length) {
    throw new Error('No content script files are declared in the manifest')
  }

  await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    files
  })
}

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
    await sendInvokeTranslation(tab)
  } catch (error) {
    if (!canInjectIntoTab(tab)) {
      console.debug('Local Translator cannot run on this page:', tab.url, error)
      return
    }

    try {
      await injectContentScript(tab)
      await sendInvokeTranslation(tab)
    } catch (injectionError) {
      console.debug('Local Translator failed to invoke page translator:', injectionError)
    }
  }
})
