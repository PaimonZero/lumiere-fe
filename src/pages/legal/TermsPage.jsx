import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';

export default function TermsPage() {
    const [activeSection, setActiveSection] = useState('section-1');
    const [scrollProgress, setScrollProgress] = useState(0);

    // Nav items
    const sections = useMemo(() => [
        { id: 'section-1', title: '1. Giới thiệu & Phạm vi áp dụng' },
        { id: 'section-2', title: '2. Định nghĩa & Bên tham gia' },
        { id: 'section-3', title: '3. Điều kiện sử dụng dịch vụ' },
        { id: 'section-4', title: '4. Xử lý Dữ liệu Cá nhân' },
        { id: 'section-5', title: '5. Thông báo Xử lý bằng AI' },
        { id: 'section-6', title: '6. Quyền Chủ thể Dữ liệu' },
        { id: 'section-7', title: '7. Quyền Rút Đồng ý' },
        { id: 'section-8', title: '8. Bảo mật thông tin' },
        { id: 'section-9', title: '9. Sở hữu trí tuệ' },
        { id: 'section-10', title: '10. Giới hạn trách nhiệm' },
        { id: 'section-11', title: '11. Thay đổi điều khoản' },
        { id: 'section-12', title: '12. Liên hệ & Khiếu nại' },
    ], []);

    // Scroll effect
    useEffect(() => {
        const handleScroll = () => {
            // Progress bar
            const totalScroll = document.documentElement.scrollTop;
            const windowHeight =
                document.documentElement.scrollHeight -
                document.documentElement.clientHeight;
            const scroll = `${totalScroll / windowHeight}`;
            setScrollProgress(scroll);

            // Active section
            const sectionElements = sections.map((s) =>
                document.getElementById(s.id),
            );
            const currentSection = sectionElements.find((element) => {
                if (!element) return false;
                const rect = element.getBoundingClientRect();
                return rect.top <= 150 && rect.bottom >= 150;
            });

            if (currentSection) {
                setActiveSection(currentSection.id);
            }
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, [sections]);

    const scrollToSection = (id) => {
        const element = document.getElementById(id);
        if (element) {
            const top =
                element.getBoundingClientRect().top + window.pageYOffset - 100;
            window.scrollTo({ top, behavior: 'smooth' });
        }
    };

    return (
        <div
            className="min-h-screen"
            style={{
                backgroundColor: 'var(--color-bg-base)',
                color: 'var(--color-text-primary)',
            }}
        >
            {/* Progress Bar */}
            <div
                className="fixed top-0 left-0 h-1.5 z-50 transition-all duration-300"
                style={{
                    width: `${scrollProgress * 100}%`,
                    backgroundColor: 'var(--color-primary)',
                }}
            />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="text-center mb-12 fade-in">
                    <h1
                        className="text-3xl md:text-4xl font-bold mb-4"
                        style={{ color: 'var(--color-primary)' }}
                    >
                        Điều Khoản Sử Dụng & Chính Sách Bảo Mật
                    </h1>
                    <p
                        className="text-sm md:text-base"
                        style={{ color: 'var(--color-text-secondary)' }}
                    >
                        Cập nhật lần cuối: 30/04/2026
                    </p>
                </div>

                <div className="flex flex-col lg:flex-row gap-8 relative">
                    {/* Sidebar */}
                    <div className="lg:w-1/4">
                        {/* Mobile Dropdown */}
                        <div className="block lg:hidden mb-6">
                            <select
                                className="w-full p-3 rounded-xl border appearance-none outline-none focus:border-indigo-500"
                                style={{
                                    backgroundColor: 'var(--color-bg-card)',
                                    borderColor: 'var(--color-border)',
                                    color: 'var(--color-text-primary)',
                                }}
                                value={activeSection}
                                onChange={(e) =>
                                    scrollToSection(e.target.value)
                                }
                            >
                                {sections.map((section) => (
                                    <option key={section.id} value={section.id}>
                                        {section.title}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Desktop Sticky Nav */}
                        <div className="hidden lg:block sticky top-8 glass-panel p-5 rounded-2xl">
                            <h3
                                className="font-bold mb-5 text-sm uppercase tracking-wider"
                                style={{ color: 'var(--color-text-muted)' }}
                            >
                                Mục lục
                            </h3>
                            <nav className="flex flex-col gap-1.5">
                                {sections.map((section) => (
                                    <button
                                        key={section.id}
                                        onClick={() =>
                                            scrollToSection(section.id)
                                        }
                                        className={`text-left text-sm py-2 px-3 rounded-lg transition-all duration-200 cursor-pointer ${activeSection === section.id ? 'font-semibold' : ''}`}
                                        style={{
                                            backgroundColor:
                                                activeSection === section.id
                                                    ? 'var(--color-bg-elevated)'
                                                    : 'transparent',
                                            color:
                                                activeSection === section.id
                                                    ? 'var(--color-primary)'
                                                    : 'var(--color-text-muted)',
                                        }}
                                    >
                                        {section.title}
                                    </button>
                                ))}
                            </nav>
                        </div>
                    </div>

                    {/* Main Content */}
                    <div className="lg:w-3/4 space-y-12 pb-20">
                        <div className="glass-panel p-6 md:p-10 rounded-2xl shadow-sm slide-in-left">
                            <section id="section-1" className="mb-12">
                                <h2
                                    className="text-xl md:text-2xl font-bold mb-5 pb-3 border-b"
                                    style={{
                                        borderColor: 'var(--color-border)',
                                    }}
                                >
                                    1. Giới thiệu & Phạm vi áp dụng
                                </h2>
                                <div className="space-y-3 leading-relaxed text-sm md:text-base">
                                    <p>
                                        Chào mừng bạn đến với{' '}
                                        <strong>Lumiere AI</strong> ("Nền
                                        tảng"). Việc bạn truy cập, đăng ký tài
                                        khoản và sử dụng các tính năng của chúng
                                        tôi đồng nghĩa với việc bạn đã đọc, hiểu
                                        rõ và đồng ý bị ràng buộc bởi các Điều
                                        Khoản Sử Dụng & Chính Sách Bảo Mật này
                                        ("Thỏa thuận").
                                    </p>
                                    <p>
                                        Thỏa thuận này áp dụng cho mọi tương tác
                                        của bạn với Nền tảng, bao gồm nhưng
                                        không giới hạn ở phiên bản web, ứng dụng
                                        di động (nếu có), và các API do chúng
                                        tôi cung cấp.
                                    </p>
                                </div>
                            </section>

                            <section id="section-2" className="mb-12">
                                <h2
                                    className="text-xl md:text-2xl font-bold mb-5 pb-3 border-b"
                                    style={{
                                        borderColor: 'var(--color-border)',
                                    }}
                                >
                                    2. Định nghĩa & Bên tham gia
                                </h2>
                                <ul className="list-disc pl-6 space-y-2 leading-relaxed text-sm md:text-base">
                                    <li>
                                        <strong>Nền tảng / Chúng tôi:</strong>{' '}
                                        Đội ngũ phát triển và quản lý hệ thống
                                        Lumiere AI.
                                    </li>
                                    <li>
                                        <strong>Người dùng / Bạn:</strong> Cá
                                        nhân hoặc tổ chức tạo tài khoản, truy
                                        cập hoặc sử dụng Dịch vụ.
                                    </li>
                                    <li>
                                        <strong>Dịch vụ:</strong> Các công cụ,
                                        tính năng sinh nội dung, trợ lý ảo và
                                        các tiện ích khác được cung cấp thông
                                        qua Nền tảng.
                                    </li>
                                    <li>
                                        <strong>
                                            Nội dung đầu vào (Input):
                                        </strong>{' '}
                                        Văn bản, hình ảnh, tài liệu hoặc dữ liệu
                                        mà bạn tải lên Nền tảng.
                                    </li>
                                    <li>
                                        <strong>
                                            Nội dung đầu ra (Output):
                                        </strong>{' '}
                                        Nội dung do AI sinh ra dựa trên Input
                                        của bạn.
                                    </li>
                                </ul>
                            </section>

                            <section id="section-3" className="mb-12">
                                <h2
                                    className="text-xl md:text-2xl font-bold mb-5 pb-3 border-b"
                                    style={{
                                        borderColor: 'var(--color-border)',
                                    }}
                                >
                                    3. Điều kiện sử dụng dịch vụ
                                </h2>
                                <div className="space-y-3 leading-relaxed text-sm md:text-base">
                                    <p>
                                        Bằng việc sử dụng Dịch vụ, bạn cam kết
                                        tuân thủ các điều kiện sau:
                                    </p>
                                    <ul className="list-decimal pl-6 space-y-2">
                                        <li>
                                            Bạn phải đủ 15 tuổi trở lên, hoặc có
                                            sự giám hộ hợp pháp từ cha mẹ/người
                                            đại diện.
                                        </li>
                                        <li>
                                            Không sử dụng Dịch vụ cho các mục
                                            đích vi phạm pháp luật, gian lận,
                                            lừa đảo hoặc truyền bá thông tin sai
                                            lệch.
                                        </li>
                                        <li>
                                            Không tải lên các nội dung chứa mã
                                            độc, virus, hoặc vi phạm quyền sở
                                            hữu trí tuệ của bên thứ ba.
                                        </li>
                                        <li>
                                            Không cố gắng dịch ngược (reverse
                                            engineer), tấn công mạng, hoặc cản
                                            trở hoạt động bình thường của Nền
                                            tảng.
                                        </li>
                                    </ul>
                                </div>
                            </section>

                            <section id="section-4" className="mb-12">
                                <div
                                    className="flex flex-col md:flex-row md:items-center gap-3 mb-5 pb-3 border-b"
                                    style={{
                                        borderColor: 'var(--color-border)',
                                    }}
                                >
                                    <h2 className="text-xl md:text-2xl font-bold">
                                        4. Xử lý Dữ liệu Cá nhân
                                    </h2>
                                    <span
                                        className="px-2.5 py-1 text-[11px] uppercase tracking-wider font-bold rounded-md"
                                        style={{
                                            backgroundColor:
                                                'rgba(91, 79, 207, 0.1)',
                                            color: 'var(--color-primary)',
                                            border: '1px solid rgba(91, 79, 207, 0.2)',
                                        }}
                                    >
                                        Nghị định 13/2023/NĐ-CP
                                    </span>
                                </div>
                                <div className="space-y-6 text-sm md:text-base leading-relaxed">
                                    <p>
                                        Chúng tôi cam kết bảo vệ dữ liệu cá nhân
                                        của bạn tuân thủ chặt chẽ theo Nghị định
                                        13/2023/NĐ-CP của Chính phủ Việt Nam.
                                    </p>

                                    <div>
                                        <h3
                                            className="font-semibold text-[1.1rem] mb-2"
                                            style={{
                                                color: 'var(--color-text-secondary)',
                                            }}
                                        >
                                            4.1 Dữ liệu thu thập
                                        </h3>
                                        <p>
                                            Chúng tôi chỉ thu thập các dữ liệu
                                            cần thiết tối thiểu:
                                        </p>
                                        <ul className="list-disc pl-6 mt-1">
                                            <li>
                                                <strong>Dữ liệu cơ bản:</strong>{' '}
                                                Họ tên, địa chỉ email, ảnh đại
                                                diện (nếu đăng nhập qua Google).
                                            </li>
                                            <li>
                                                <strong>
                                                    Dữ liệu tương tác:
                                                </strong>{' '}
                                                Lịch sử truy cập, địa chỉ IP,
                                                thông tin thiết bị, log hệ
                                                thống.
                                            </li>
                                            <li>
                                                <strong>
                                                    Dữ liệu nội dung:
                                                </strong>{' '}
                                                Lịch sử trò chuyện (prompts) và
                                                nội dung sinh ra (outputs) gắn
                                                liền với tài khoản của bạn.
                                            </li>
                                        </ul>
                                    </div>

                                    <div>
                                        <h3
                                            className="font-semibold text-[1.1rem] mb-2"
                                            style={{
                                                color: 'var(--color-text-secondary)',
                                            }}
                                        >
                                            4.2 Mục đích & Cơ sở pháp lý
                                        </h3>
                                        <p>Mục đích xử lý:</p>
                                        <ul className="list-disc pl-6 mt-1 mb-2">
                                            <li>
                                                Khởi tạo, xác thực và quản lý
                                                tài khoản.
                                            </li>
                                            <li>
                                                Cung cấp và duy trì hoạt động ổn
                                                định của Nền tảng.
                                            </li>
                                            <li>
                                                Cá nhân hóa và cải thiện chất
                                                lượng của hệ thống AI.
                                            </li>
                                            <li>
                                                Phát hiện và ngăn chặn gian lận,
                                                lạm dụng hệ thống.
                                            </li>
                                        </ul>
                                        <p>
                                            Cơ sở pháp lý:{' '}
                                            <strong>Sự đồng ý rõ ràng</strong>{' '}
                                            của bạn khi tick vào ô chấp nhận tại
                                            trang đăng ký (theo Điều 11 NĐ 13).
                                        </p>
                                    </div>

                                    <div>
                                        <h3
                                            className="font-semibold text-[1.1rem] mb-2"
                                            style={{
                                                color: 'var(--color-text-secondary)',
                                            }}
                                        >
                                            4.3 Thời hạn lưu trữ
                                        </h3>
                                        <p>
                                            Dữ liệu cá nhân của bạn sẽ được lưu
                                            trữ bắt đầu từ thời điểm bạn đăng ký
                                            tài khoản cho đến khi:
                                        </p>
                                        <ul className="list-disc pl-6 mt-1">
                                            <li>
                                                Bạn yêu cầu xóa tài khoản hoặc
                                                xóa dữ liệu.
                                            </li>
                                            <li>
                                                Bạn thực hiện quyền rút lại sự
                                                đồng ý.
                                            </li>
                                            <li>
                                                Nền tảng ngừng cung cấp dịch vụ
                                                (dữ liệu sẽ được hủy an toàn).
                                            </li>
                                        </ul>
                                    </div>

                                    <div>
                                        <h3
                                            className="font-semibold text-[1.1rem] mb-2"
                                            style={{
                                                color: 'var(--color-text-secondary)',
                                            }}
                                        >
                                            4.4 Bên thứ ba & Chuyển giao dữ liệu
                                        </h3>
                                        <p>
                                            Chúng tôi <strong>KHÔNG</strong> bán
                                            dữ liệu cá nhân của bạn. Dữ liệu chỉ
                                            được chia sẻ trong các trường hợp:
                                        </p>
                                        <ul className="list-disc pl-6 mt-1">
                                            <li>
                                                Cung cấp cho các đối tác hạ tầng
                                                đám mây (Cloud Providers) có ký
                                                kết thỏa thuận bảo mật chuẩn
                                                (NDA).
                                            </li>
                                            <li>
                                                Theo yêu cầu bằng văn bản của cơ
                                                quan nhà nước có thẩm quyền theo
                                                quy định của pháp luật Việt Nam.
                                            </li>
                                        </ul>
                                    </div>
                                </div>
                            </section>

                            <section id="section-5" className="mb-12">
                                <div
                                    className="flex flex-col md:flex-row md:items-center gap-3 mb-5 pb-3 border-b"
                                    style={{
                                        borderColor: 'var(--color-border)',
                                    }}
                                >
                                    <h2 className="text-xl md:text-2xl font-bold">
                                        5. Thông báo Xử lý bằng AI
                                    </h2>
                                    <span className="px-2.5 py-1 text-[11px] uppercase tracking-wider font-bold rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
                                        Luật Trí tuệ nhân tạo 2026
                                    </span>
                                </div>
                                <div className="space-y-4 text-sm md:text-base leading-relaxed">
                                    <p>
                                        Đáp ứng yêu cầu minh bạch của Luật Trí
                                        tuệ nhân tạo (2026), chúng tôi thông báo
                                        cho bạn các thông tin sau:
                                    </p>
                                    <ul className="list-disc pl-6 space-y-2">
                                        <li>
                                            <strong>Tương tác với AI:</strong>{' '}
                                            Bạn đang tương tác trực tiếp với một
                                            hệ thống Trí tuệ nhân tạo (Mô hình
                                            ngôn ngữ lớn), không phải con người.
                                            Các nội dung đầu ra được sinh tự
                                            động dựa trên thuật toán xác suất và
                                            dữ liệu huấn luyện.
                                        </li>
                                        <li>
                                            <strong>
                                                Không quyết định hoàn toàn tự
                                                động:
                                            </strong>{' '}
                                            Chúng tôi không sử dụng AI để đưa ra
                                            các quyết định tự động có ảnh hưởng
                                            đến quyền, lợi ích hợp pháp hoặc tạo
                                            ra các hậu quả pháp lý đối với bạn
                                            (như tín dụng, tuyển dụng, tư pháp).
                                        </li>
                                        <li>
                                            <strong>
                                                Rủi ro về tính chính xác:
                                            </strong>{' '}
                                            Mặc dù AI được tối ưu, đôi khi nó có
                                            thể sinh ra thông tin không chính
                                            xác, lỗi thời hoặc có thành kiến (AI
                                            Hallucinations). Bạn cần tự xác minh
                                            các thông tin quan trọng trước khi
                                            sử dụng.
                                        </li>
                                        <li>
                                            <strong>
                                                Minh bạch về dữ liệu:
                                            </strong>{' '}
                                            Nội dung nhập (Input) của bạn có thể
                                            được tự động ẩn danh hóa (loại bỏ
                                            thông tin định danh cá nhân PII) và
                                            sử dụng để huấn luyện, tinh chỉnh
                                            nhằm cải thiện mô hình AI của Nền
                                            tảng.
                                        </li>
                                        <li>
                                            <strong>
                                                Quyền yêu cầu giải thích:
                                            </strong>{' '}
                                            Bạn có quyền yêu cầu Nền tảng giải
                                            thích về các tham số hoặc cơ chế
                                            chung dẫn đến các kết quả sinh ra từ
                                            AI đối với bạn, gửi qua bộ phận hỗ
                                            trợ.
                                        </li>
                                    </ul>
                                </div>
                            </section>

                            <section id="section-6" className="mb-12">
                                <h2
                                    className="text-xl md:text-2xl font-bold mb-5 pb-3 border-b"
                                    style={{
                                        borderColor: 'var(--color-border)',
                                    }}
                                >
                                    6. Quyền Chủ thể Dữ liệu
                                </h2>
                                <div className="space-y-3 text-sm md:text-base leading-relaxed">
                                    <p>
                                        Với tư cách là Chủ thể dữ liệu, bạn có
                                        đầy đủ 7 quyền theo quy định tại Điều 9
                                        Nghị định 13/2023/NĐ-CP:
                                    </p>
                                    <ol
                                        className="list-decimal pl-6 space-y-2 font-medium"
                                        style={{
                                            color: 'var(--color-text-secondary)',
                                        }}
                                    >
                                        <li>
                                            <strong
                                                style={{
                                                    color: 'var(--color-text-primary)',
                                                }}
                                            >
                                                Quyền được biết (Truy cập):
                                            </strong>{' '}
                                            Biết rõ dữ liệu nào đang được xử lý.
                                        </li>
                                        <li>
                                            <strong
                                                style={{
                                                    color: 'var(--color-text-primary)',
                                                }}
                                            >
                                                Quyền chỉnh sửa:
                                            </strong>{' '}
                                            Cập nhật, sửa đổi dữ liệu không
                                            chính xác trong Cài đặt tài khoản.
                                        </li>
                                        <li>
                                            <strong
                                                style={{
                                                    color: 'var(--color-text-primary)',
                                                }}
                                            >
                                                Quyền xóa dữ liệu (Quyền được
                                                lãng quên):
                                            </strong>{' '}
                                            Yêu cầu xóa toàn bộ dữ liệu cá nhân
                                            thông qua chức năng "Xóa tài khoản".
                                        </li>
                                        <li>
                                            <strong
                                                style={{
                                                    color: 'var(--color-text-primary)',
                                                }}
                                            >
                                                Quyền rút lại sự đồng ý:
                                            </strong>{' '}
                                            (Chi tiết tại Mục 7).
                                        </li>
                                        <li>
                                            <strong
                                                style={{
                                                    color: 'var(--color-text-primary)',
                                                }}
                                            >
                                                Quyền hạn chế xử lý:
                                            </strong>{' '}
                                            Tạm ngưng việc xử lý dữ liệu trong
                                            các trường hợp cụ thể.
                                        </li>
                                        <li>
                                            <strong
                                                style={{
                                                    color: 'var(--color-text-primary)',
                                                }}
                                            >
                                                Quyền phản đối xử lý:
                                            </strong>{' '}
                                            Từ chối cho phép sử dụng dữ liệu cho
                                            mục đích quảng cáo hoặc profiling.
                                        </li>
                                        <li>
                                            <strong
                                                style={{
                                                    color: 'var(--color-text-primary)',
                                                }}
                                            >
                                                Quyền yêu cầu bồi thường thiệt
                                                hại:
                                            </strong>{' '}
                                            Theo quy định của pháp luật nếu có
                                            vi phạm.
                                        </li>
                                    </ol>
                                    <p className="mt-4">
                                        Để thực thi các quyền này (ngoài các
                                        công cụ có sẵn trên giao diện), bạn có
                                        thể liên hệ với chúng tôi qua thông tin
                                        ở Mục 12. Chúng tôi sẽ phản hồi trong
                                        vòng 72 giờ làm việc.
                                    </p>
                                </div>
                            </section>

                            <section id="section-7" className="mb-12">
                                <h2
                                    className="text-xl md:text-2xl font-bold mb-5 pb-3 border-b"
                                    style={{
                                        borderColor: 'var(--color-border)',
                                    }}
                                >
                                    7. Quyền Rút Đồng ý & Hậu quả
                                </h2>
                                <div className="space-y-4 text-sm md:text-base leading-relaxed">
                                    <p>
                                        Bất cứ lúc nào, bạn có quyền rút lại sự
                                        đồng ý cho phép Nền tảng xử lý dữ liệu
                                        cá nhân của mình.
                                    </p>

                                    <div className="p-5 rounded-xl bg-amber-50 border border-amber-200 shadow-sm my-5">
                                        <h3 className="flex items-center gap-2 font-bold text-amber-900 mb-2">
                                            <svg
                                                width="20"
                                                height="20"
                                                viewBox="0 0 24 24"
                                                fill="none"
                                                stroke="currentColor"
                                                strokeWidth="2"
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                            >
                                                <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
                                                <path d="M12 9v4" />
                                                <path d="M12 17h.01" />
                                            </svg>
                                            Hậu quả pháp lý (Theo Điều 9, khoản
                                            3 NĐ 13/2023)
                                        </h3>
                                        <p className="text-amber-800 text-sm">
                                            Nếu bạn thực hiện quyền rút lại sự
                                            đồng ý:
                                        </p>
                                        <ul className="list-disc pl-5 mt-2 text-amber-800 text-sm space-y-1">
                                            <li>
                                                <strong>
                                                    Việc rút đồng ý không làm
                                                    ảnh hưởng đến tính hợp pháp
                                                </strong>{' '}
                                                của việc xử lý dữ liệu cá nhân
                                                đã được thực hiện trước thời
                                                điểm bạn rút đồng ý.
                                            </li>
                                            <li>
                                                <strong>
                                                    Gián đoạn Dịch vụ:
                                                </strong>{' '}
                                                Vì AI cần phân tích ngữ cảnh
                                                (Input) và dữ liệu hồ sơ để hoạt
                                                động, việc rút đồng ý sẽ dẫn đến
                                                việc chúng tôi{' '}
                                                <strong>
                                                    không thể tiếp tục cung cấp
                                                    Dịch vụ
                                                </strong>
                                                . Tài khoản của bạn có thể bị
                                                tạm khóa hoặc chấm dứt vĩnh
                                                viễn.
                                            </li>
                                        </ul>
                                    </div>

                                    <p>
                                        <strong>Cách thức thực hiện:</strong>{' '}
                                        Gửi email có tiêu đề{' '}
                                        <em>
                                            "[YÊU CẦU RÚT ĐỒNG Ý] - [Email đăng
                                            nhập]"
                                        </em>{' '}
                                        tới địa chỉ privacy@lumiere.ai.
                                    </p>
                                </div>
                            </section>

                            <section id="section-8" className="mb-12">
                                <h2
                                    className="text-xl md:text-2xl font-bold mb-5 pb-3 border-b"
                                    style={{
                                        borderColor: 'var(--color-border)',
                                    }}
                                >
                                    8. Bảo mật thông tin
                                </h2>
                                <div className="space-y-3 text-sm md:text-base leading-relaxed">
                                    <p>
                                        Chúng tôi triển khai các biện pháp kỹ
                                        thuật và tổ chức bảo mật theo tiêu chuẩn
                                        công nghiệp nhằm chống truy cập trái
                                        phép, tiết lộ, thay đổi hoặc phá hủy dữ
                                        liệu cá nhân:
                                    </p>
                                    <ul className="list-disc pl-6 space-y-1">
                                        <li>
                                            Mã hóa dữ liệu trong quá trình
                                            truyền tải (TLS/SSL).
                                        </li>
                                        <li>
                                            Mã hóa dữ liệu tại nơi lưu trữ (Data
                                            at rest encryption).
                                        </li>
                                        <li>
                                            Kiểm soát truy cập nghiêm ngặt dựa
                                            trên vai trò (RBAC) đối với đội ngũ
                                            vận hành.
                                        </li>
                                        <li>
                                            Định kỳ kiểm tra lỗ hổng bảo mật hệ
                                            thống.
                                        </li>
                                    </ul>
                                    <p
                                        className="text-sm italic"
                                        style={{
                                            color: 'var(--color-text-muted)',
                                        }}
                                    >
                                        Lưu ý: Không có hệ thống lưu trữ qua
                                        internet nào an toàn tuyệt đối 100%. Nếu
                                        phát hiện rò rỉ dữ liệu, chúng tôi sẽ
                                        thông báo cho bạn và Cục An ninh mạng và
                                        phòng, chống tội phạm sử dụng công nghệ
                                        cao (A05) trong thời hạn 72 giờ theo quy
                                        định.
                                    </p>
                                </div>
                            </section>

                            <section id="section-9" className="mb-12">
                                <h2
                                    className="text-xl md:text-2xl font-bold mb-5 pb-3 border-b"
                                    style={{
                                        borderColor: 'var(--color-border)',
                                    }}
                                >
                                    9. Sở hữu trí tuệ
                                </h2>
                                <div className="space-y-3 text-sm md:text-base leading-relaxed">
                                    <p>
                                        <strong>Quyền của Bạn:</strong> Bạn giữ
                                        mọi quyền sở hữu đối với Nội dung đầu
                                        vào (Input) do bạn tạo ra. Trong phạm vi
                                        pháp luật cho phép, bạn được toàn quyền
                                        sở hữu và sử dụng thương mại các Nội
                                        dung đầu ra (Output) do Nền tảng sinh ra
                                        dựa trên Input của bạn.
                                    </p>
                                    <p>
                                        <strong>Quyền của Chúng tôi:</strong>{' '}
                                        Nền tảng, giao diện người dùng, thương
                                        hiệu "Lumiere AI", thuật toán, mô hình
                                        và mã nguồn cấu thành nên Dịch vụ là tài
                                        sản độc quyền của chúng tôi, được bảo vệ
                                        bởi luật Sở hữu trí tuệ.
                                    </p>
                                </div>
                            </section>

                            <section id="section-10" className="mb-12">
                                <h2
                                    className="text-xl md:text-2xl font-bold mb-5 pb-3 border-b"
                                    style={{
                                        borderColor: 'var(--color-border)',
                                    }}
                                >
                                    10. Giới hạn trách nhiệm
                                </h2>
                                <div className="space-y-3 text-sm md:text-base leading-relaxed">
                                    <p>
                                        Trong phạm vi tối đa luật pháp cho phép,
                                        Nền tảng được cung cấp trên cơ sở
                                        "Nguyên trạng" (AS IS) và "Sẵn có" (AS
                                        AVAILABLE).
                                    </p>
                                    <p>
                                        Lumiere AI <strong>KHÔNG</strong> chịu
                                        trách nhiệm cho:
                                    </p>
                                    <ul className="list-disc pl-6">
                                        <li>
                                            Bất kỳ thiệt hại gián tiếp, đặc
                                            biệt, hoặc ngẫu nhiên nào phát sinh
                                            từ việc bạn sử dụng hoặc không thể
                                            sử dụng Nền tảng.
                                        </li>
                                        <li>
                                            Các hành vi vi phạm bản quyền do bạn
                                            sử dụng Output của AI có sự tương
                                            đồng ngẫu nhiên với các tác phẩm đã
                                            được bảo hộ.
                                        </li>
                                        <li>
                                            Sự gián đoạn dịch vụ do các nguyên
                                            nhân bất khả kháng (thiên tai, chiến
                                            tranh, sự cố hạ tầng mạng viễn
                                            thông).
                                        </li>
                                    </ul>
                                </div>
                            </section>

                            <section id="section-11" className="mb-12">
                                <h2
                                    className="text-xl md:text-2xl font-bold mb-5 pb-3 border-b"
                                    style={{
                                        borderColor: 'var(--color-border)',
                                    }}
                                >
                                    11. Thay đổi điều khoản
                                </h2>
                                <div className="space-y-3 text-sm md:text-base leading-relaxed">
                                    <p>
                                        Chúng tôi bảo lưu quyền sửa đổi, bổ sung
                                        Thỏa thuận này tại từng thời điểm để phù
                                        hợp với sự thay đổi của pháp luật (đặc
                                        biệt là các nghị định mới về AI và Dữ
                                        liệu) hoặc tính năng sản phẩm.
                                    </p>
                                    <p>
                                        <strong>Cơ chế thông báo:</strong> Mọi
                                        thay đổi trọng yếu liên quan đến việc xử
                                        lý dữ liệu sẽ được thông báo qua địa chỉ
                                        email bạn đã đăng ký hoặc hiển thị nổi
                                        bật trên Nền tảng{' '}
                                        <strong>ít nhất 15 ngày</strong> trước
                                        khi có hiệu lực.
                                    </p>
                                    <p>
                                        Việc bạn tiếp tục sử dụng Dịch vụ sau
                                        thời điểm có hiệu lực đồng nghĩa với
                                        việc bạn chấp nhận các sửa đổi đó.
                                    </p>
                                </div>
                            </section>

                            <section id="section-12" className="mb-8">
                                <h2
                                    className="text-xl md:text-2xl font-bold mb-5 pb-3 border-b"
                                    style={{
                                        borderColor: 'var(--color-border)',
                                    }}
                                >
                                    12. Liên hệ & Khiếu nại
                                </h2>
                                <div className="space-y-3 text-sm md:text-base leading-relaxed">
                                    <p>
                                        Nếu bạn có bất kỳ câu hỏi, khiếu nại về
                                        Thỏa thuận này, hoặc muốn thực thi Quyền
                                        Chủ thể Dữ liệu của mình, vui lòng liên
                                        hệ với Bộ phận Pháp chế & Tuân thủ (Data
                                        Protection Officer - DPO) của chúng tôi:
                                    </p>
                                    <div
                                        className="p-5 rounded-xl border mt-4"
                                        style={{
                                            backgroundColor:
                                                'var(--color-bg-base)',
                                            borderColor: 'var(--color-border)',
                                        }}
                                    >
                                        <ul className="space-y-2">
                                            <li className="flex items-start gap-2">
                                                <span className="font-semibold w-24 shrink-0">
                                                    Email:
                                                </span>
                                                <a
                                                    href="mailto:privacy@lumiere.ai"
                                                    className="hover:underline"
                                                    style={{
                                                        color: 'var(--color-primary)',
                                                    }}
                                                >
                                                    privacy@lumiere.ai
                                                </a>
                                            </li>
                                            <li className="flex items-start gap-2">
                                                <span className="font-semibold w-24 shrink-0">
                                                    Hotline:
                                                </span>
                                                <span>
                                                    1900-LUMIERE (Giờ hành
                                                    chính)
                                                </span>
                                            </li>
                                            <li className="flex items-start gap-2">
                                                <span className="font-semibold w-24 shrink-0">
                                                    Địa chỉ:
                                                </span>
                                                <span>
                                                    VinUniversity, Đại lộ Giáo
                                                    dục, Ocean Park, Gia Lâm, Hà
                                                    Nội, Việt Nam
                                                </span>
                                            </li>
                                        </ul>
                                    </div>
                                </div>
                            </section>
                        </div>
                    </div>
                </div>

                <footer
                    className="mt-10 text-center border-t pt-8 pb-12"
                    style={{
                        borderColor: 'var(--color-border)',
                        color: 'var(--color-text-muted)',
                    }}
                >
                    <p className="text-sm">
                        Lumiere AI &copy; 2026. Mọi quyền được bảo lưu.
                    </p>
                    <div className="mt-5">
                        <Link
                            to="/login"
                            className="inline-flex items-center gap-2 hover:underline font-medium px-4 py-2 rounded-lg transition-colors"
                            style={{
                                color: 'var(--color-primary)',
                                backgroundColor: 'var(--color-bg-elevated)',
                            }}
                        >
                            <svg
                                width="16"
                                height="16"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            >
                                <path d="m15 18-6-6 6-6" />
                            </svg>
                            Quay lại trang đăng nhập
                        </Link>
                    </div>
                </footer>
            </div>
        </div>
    );
}
