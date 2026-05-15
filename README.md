# 🔥 이거 대신 주식 샀다

소비 충동을 투자로 바꾸는 기록장

## 로컬 실행

```bash
npm install
npm run dev
```

## Vercel 배포 방법

### 방법 1 — GitHub 연동 (추천)

1. 이 폴더를 GitHub에 올리기
   ```bash
   git init
   git add .
   git commit -m "첫 배포"
   # GitHub에서 새 레포 만들고:
   git remote add origin https://github.com/본인아이디/instead-invest.git
   git push -u origin main
   ```

2. [vercel.com](https://vercel.com) → **Add New Project**
3. GitHub 레포 선택 → **Deploy** 클릭
4. 끝! 자동으로 URL 발급됨 (예: `instead-invest.vercel.app`)

### 방법 2 — Vercel CLI (더 빠름)

```bash
npm install -g vercel
vercel
```

## 주의사항

- 데이터는 **브라우저 localStorage**에 저장돼요
- 같은 기기/브라우저에서는 데이터가 유지되지만, 다른 기기에서는 공유되지 않아요
- 시세 조회는 Anthropic API를 사용해요 — API 키가 필요해요 (아래 참고)

## API 키 설정 (시세 자동 조회용)

Vercel 대시보드 → 프로젝트 → **Settings** → **Environment Variables**에서 추가:

```
VITE_ANTHROPIC_API_KEY=sk-ant-...
```

그리고 `src/App.jsx`에서 fetch 헤더에 추가:
```js
"x-api-key": import.meta.env.VITE_ANTHROPIC_API_KEY,
```
