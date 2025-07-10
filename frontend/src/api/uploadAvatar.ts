export async function uploadAvatar(file: File) {
    const form = new FormData()
    form.append("file", file)
  
    const token = localStorage.getItem("access_token")   // your FastAPI JWT
    const res = await fetch(
      `${import.meta.env.VITE_API_BASE}/auth/avatar`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: form,
      }
    )
  
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err.detail || "file upload failed")
    }
  
    const { publicUrl } = await res.json()
    return publicUrl
  }  
