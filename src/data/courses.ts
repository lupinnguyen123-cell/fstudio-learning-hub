import type { Course, LessonBlock, Question, User } from '../types'

const now = '2026-07-18T00:00:00.000Z'
const makeOptions = (values: string[], correct: number) => values.map((text, index) => ({ id: `o-${index + 1}`, text, correct: index === correct, feedback: index === correct ? 'Chính xác — bạn đã chọn theo nhu cầu khách hàng.' : 'Hãy quay lại nhu cầu thực tế trước khi chọn.' }))
const blocks = (topic: string, index: number): LessonBlock[] => [
  { id: `h-${index}`, type: 'heading', level: 2, text: `Ứng dụng ${topic.toLowerCase()} trong tư vấn` },
  { id: `p-${index}`, type: 'paragraph', text: `Bài học giúp bạn chuyển kiến thức về ${topic.toLowerCase()} thành một cuộc trò chuyện rõ ràng, phù hợp với nhu cầu thực tế của khách hàng.` },
  { id: `key-${index}`, type: 'key_point', title: 'Điểm cần nhớ', text: 'Luôn hỏi để hiểu nhu cầu trước khi giới thiệu cấu hình hoặc sản phẩm.' },
  { id: `scenario-${index}`, type: 'scenario', context: 'Khách hàng là sinh viên thường xuyên di chuyển.', customerQuote: 'Mình cần máy dùng học tập và chỉnh video cơ bản.', options: [{ id: 's1', text: 'Hỏi thêm về phần mềm và ngân sách', feedback: 'Đúng hướng: câu hỏi mở giúp xác định nhu cầu.', recommended: true }, { id: 's2', text: 'Giới thiệu ngay cấu hình cao nhất', feedback: 'Chưa phù hợp vì chưa hiểu rõ nhu cầu.', recommended: false }], explanation: 'Tư vấn nên bắt đầu bằng khám phá nhu cầu.' },
  { id: `dialogue-${index}`, type: 'dialogue', title: 'Đoạn hội thoại mẫu', lines: [{ speaker: 'Trainer', text: 'Bạn thường dùng những phần mềm nào cho việc học?' }, { speaker: 'Khách hàng', text: 'Mình dùng trình duyệt, Office và đôi khi chỉnh video.' }] },
  { id: `list-${index}`, type: 'bullet_list', title: 'Checklist tư vấn', items: ['Xác nhận nhu cầu chính', 'Diễn giải lợi ích thay vì chỉ đọc thông số', 'Kiểm tra lại băn khoăn trước khi kết luận'] },
  { id: `quick-${index}`, type: 'quick_question', question: 'Câu hỏi nào nên được đặt trước khi đề xuất cấu hình?', options: makeOptions(['Hỏi về công việc, phần mềm và ngân sách', 'Hỏi màu máy yêu thích'], 0), explanation: 'Nhu cầu sử dụng quyết định cấu hình phù hợp.' },
]

const moduleTitles = ['Hiểu nhu cầu khách hàng', 'Phân biệt MacBook Air và MacBook Pro', 'Tư vấn RAM và dung lượng', 'Xử lý câu hỏi về phần mềm', 'Hệ sinh thái Apple', 'Bài kiểm tra cuối khóa']
const prompts: Array<[string, string[], number, string, string]> = [
  ['Khi bắt đầu tư vấn, hành động nào nên được ưu tiên?', ['Giới thiệu mẫu bán chạy', 'Hỏi về nhu cầu sử dụng', 'Báo ưu đãi', 'So sánh mọi cấu hình'], 1, 'module-1', 'lesson-1'],
  ['Khách thường xuyên di chuyển nên ưu tiên yếu tố nào?', ['Thiết bị gọn nhẹ', 'Màn hình lớn nhất', 'RAM cao nhất', 'Nhiều phụ kiện'], 0, 'module-1', 'lesson-1'],
  ['MacBook Air phù hợp nhất với nhu cầu nào?', ['Render 3D chuyên sâu', 'Học tập và công việc hằng ngày', 'Máy chủ dữ liệu', 'Thi đấu game'], 1, 'module-2', 'lesson-2'],
  ['MacBook Pro nên được cân nhắc khi nào?', ['Chỉ đọc email', 'Cần hiệu năng duy trì cho tác vụ nặng', 'Chỉ xem phim', 'Không dùng phần mềm'], 1, 'module-2', 'lesson-2'],
  ['RAM ảnh hưởng trực tiếp nhất đến điều gì?', ['Màu máy', 'Khả năng xử lý nhiều tác vụ', 'Trọng lượng', 'Kích thước sạc'], 1, 'module-3', 'lesson-3'],
  ['Khi chọn dung lượng lưu trữ, nên hỏi gì?', ['Màu yêu thích', 'Loại và dung lượng dữ liệu thường lưu', 'Chiều cao', 'Nhà mạng'], 1, 'module-3', 'lesson-3'],
  ['Khi khách hỏi về phần mềm, cách trả lời tốt nhất là gì?', ['Cam kết mọi phần mềm đều chạy', 'Kiểm tra phần mềm và phiên bản cụ thể', 'Bỏ qua câu hỏi', 'Yêu cầu đổi nhu cầu'], 1, 'module-4', 'lesson-4'],
  ['Nếu phần mềm chưa hỗ trợ, nên làm gì?', ['Che giấu thông tin', 'Đề xuất phương án thay thế phù hợp', 'Khẳng định vẫn chạy', 'Kết thúc tư vấn'], 1, 'module-4', 'lesson-4'],
  ['Lợi ích chính của hệ sinh thái là gì?', ['Thiết bị phối hợp liền mạch', 'Tăng kích thước màn hình', 'Không cần internet', 'Thay mọi phụ kiện'], 0, 'module-5', 'lesson-5'],
  ['Trước khi kết thúc tư vấn, cần làm gì?', ['Đọc lại toàn bộ thông số', 'Xác nhận lựa chọn và băn khoăn còn lại', 'Đổi sản phẩm khác', 'Chỉ nhắc giá'], 1, 'module-6', 'lesson-6'],
]
export const quizQuestions: Question[] = prompts.map(([prompt, options, correctOptionIndex, relatedModuleId, relatedLessonId], index) => ({ id: `q${index + 1}`, type: 'multiple_choice', prompt, options, correctOptionIndex, correctOptionIndexes: [correctOptionIndex], relatedModuleId, relatedLessonId, points: 10, explanation: `Đáp án phản ánh nguyên tắc trong ${moduleTitles[Number(relatedModuleId.split('-')[1]) - 1].toLowerCase()}.` }))

export const courseCatalog: Course[] = [{
  id: 'mac-back-to-school', title: 'Tư vấn Mac mùa Back to School', description: 'Trang bị kiến thức và kỹ năng tư vấn phù hợp cho khách hàng học sinh, sinh viên trong mùa tựu trường.', category: 'Kỹ năng tư vấn', durationMinutes: 110, level: 'Cơ bản', status: 'not-started', progress: 0, publishStatus: 'published', coverUrl: '', accentColor: '#2563eb', createdAt: now, updatedAt: now,
  objectives: ['Đặt câu hỏi để xác định đúng nhu cầu học tập', 'Phân biệt lựa chọn sản phẩm và cấu hình', 'Xử lý băn khoăn về phần mềm và hệ sinh thái'],
  modules: moduleTitles.map((title, index) => ({ id: `module-${index + 1}`, title, xpReward: 20, lessons: [{ id: `lesson-${index + 1}`, title: index === 5 ? 'Ôn tập trước bài kiểm tra' : title, durationMinutes: index === 5 ? 10 : 15 + index, required: true, xpReward: 50, blocks: blocks(title, index + 1) }] })),
  quiz: { id: 'quiz-mac-bts', passScore: 80, questions: quizQuestions, xpReward: 100 },
  gamification: { courseCompletionXp: 150, badges: [{ id: 'badge-first-lesson', name: 'Khởi đầu tốt', description: 'Hoàn thành bài học đầu tiên', condition: 'first_lesson' }, { id: 'badge-quiz', name: 'Kiến thức vững vàng', description: 'Đạt quiz cuối khóa', condition: 'quiz_passed' }, { id: 'badge-course', name: 'Mac BTS Ready', description: 'Hoàn thành khóa học', condition: 'course_complete' }] },
}]

export const currentUser: User = { id: 'user-01', name: 'Minh Anh', role: 'employee', store: 'F.Studio Quận 1' }
