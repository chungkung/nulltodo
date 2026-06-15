import { useNavigate } from 'react-router-dom';
import { ChevronLeft, FileText } from 'lucide-react';

export default function UserAgreementPage() {
  const navigate = useNavigate();

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => navigate(-1)}
          className="p-2 rounded-xl hover:bg-white/10 transition-colors"
        >
          <ChevronLeft className="w-6 h-6 text-white" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-white">用户协议</h1>
        </div>
      </div>

      <div className="glass-effect rounded-2xl p-6 border border-white/10 space-y-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
            <FileText className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-white">NullTodo 用户服务协议</h2>
            <p className="text-sm text-gray-400">最后更新：2026年5月13日</p>
          </div>
        </div>

        <div className="space-y-6 text-gray-300">
          <section>
            <h3 className="text-lg font-semibold text-white mb-3">1. 服务条款</h3>
            <p className="text-sm leading-relaxed">
              欢迎使用NullTodo！本协议构成您与NullTodo之间关于使用本服务的法律协议。请仔细阅读本协议。
            </p>
          </section>

          <section>
            <h3 className="text-lg font-semibold text-white mb-3">2. 用户账户</h3>
            <p className="text-sm leading-relaxed">
              您需要创建账户才能使用本应用的完整功能。您有责任维护账户安全，并对账户下的所有活动负责。
            </p>
          </section>

          <section>
            <h3 className="text-lg font-semibold text-white mb-3">3. 用户数据</h3>
            <p className="text-sm leading-relaxed">
              您创建的所有任务数据均存储在您的本地设备或您配置的服务器上。我们尊重您的数据隐私。
            </p>
          </section>

          <section>
            <h3 className="text-lg font-semibold text-white mb-3">4. 服务使用规范</h3>
            <p className="text-sm leading-relaxed">
              您同意不会将本服务用于任何非法目的，不会通过本服务传播恶意软件或进行其他恶意活动。
            </p>
          </section>

          <section>
            <h3 className="text-lg font-semibold text-white mb-3">5. 知识产权</h3>
            <p className="text-sm leading-relaxed">
              NullTodo的所有软件、设计、图像均受知识产权法保护。您仅获得使用本软件的非独占许可。
            </p>
          </section>

          <section>
            <h3 className="text-lg font-semibold text-white mb-3">6. 免责声明</h3>
            <p className="text-sm leading-relaxed">
              本服务按"现状"提供，不做任何明示或暗示的保证。我们不对服务中断或数据丢失承担责任。
            </p>
          </section>

          <section>
            <h3 className="text-lg font-semibold text-white mb-3">7. 协议修改</h3>
            <p className="text-sm leading-relaxed">
              我们保留随时修改本协议的权利。修改后的协议将在应用内公布，继续使用即表示您接受修改。
            </p>
          </section>

          <section>
            <h3 className="text-lg font-semibold text-white mb-3">8. 联系我们</h3>
            <p className="text-sm leading-relaxed">
              如有任何问题，请通过应用内反馈功能与我们联系。
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
