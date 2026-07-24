sed -i '143,155c\
  };\n\
  const tabsContainerRef = useRef<HTMLDivElement>(null);\n\
\n\
  useEffect(() => {\n\
    const el = tabsContainerRef.current;\n\
    if (!el) return;\n\
    let isDown = false;\n\
    let startX: number;\n\
    let scrollLeft: number;\n\
\n\
    const onMouseDown = (e: MouseEvent) => {\n\
      isDown = true;\n\
      el.classList.add("cursor-grabbing");\
' src/components/UserManagementAdmin.tsx
