# Welcome to your Expo app 👋

This is an [Expo](https://expo.dev) project created with [`create-expo-app`](https://www.npmjs.com/package/create-expo-app).

## Get started

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the app

   ```bash
    npx expo start
   ```

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

You can start developing by editing the files inside the **app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).

## Get a fresh project

When you're ready, run:

```bash
npm run reset-project
```

This command will move the starter code to the **app-example** directory and create a blank **app** directory where you can start developing.

## Learn more

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.

## Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.


## Git

====================================================
    Git Flow cho dự án Photo‑app (React Native/Expo)
====================================================

1. Tổng quan
   - Nhánh chính:
     • master   : Luôn luôn là code đã release.
     • develop  : Code tích hợp, chuẩn bị cho release.

   - Nhánh hỗ trợ:
     • feature/… : Tính năng mới, xuất phát từ develop.
     • release/… : Chuẩn bị phiên bản, xuất phát từ develop.
     • hotfix/…  : Sửa lỗi khẩn cấp production, xuất phát từ master.

2. Khởi tạo Git Flow
   $ git flow init -d
   (để dùng cấu hình mặc định: master/develop)

3. Quy ước đặt tên
   - feature/<tên-tính-năng>
   - release/<version>          (ví dụ: release/1.2.0)
   - hotfix/<version>           (ví dụ: hotfix/1.2.1)

4. Luồng làm việc

   4.1. Phát triển tính năng mới
     $ git flow feature start <tên-tính-năng>
     → làm việc, commit thường xuyên vào feature/…
     $ git flow feature finish <tên-tính-năng>
     → Git tự merge về develop và xoá nhánh feature.

   4.2. Chuẩn bị bản Release
     $ git flow release start <version>
     → cập nhật version, docs, test
     $ git flow release finish <version>
     → Git tự:
        • merge release → master (tag version)
        • merge release → develop
        • xóa nhánh release

   4.3. Hotfix (sửa lỗi khẩn)
     $ git flow hotfix start <version>
     → sửa, commit
     $ git flow hotfix finish <version>
     → Git tự:
        • merge hotfix → master (tag version)
        • merge hotfix → develop
        • xóa nhánh hotfix

5. Đẩy (push) lên remote
   - Sau mỗi finish: 
     $ git push origin master develop
     $ git push --tags

6. Ghi chú
   - Luôn rebase/sync develop trước khi start feature.
   - Tuân thủ code review & CI trước khi merge.
   - Cập nhật CHANGELOG.md ở nhánh release.

====================================================

