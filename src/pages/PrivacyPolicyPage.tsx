import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Shield } from 'lucide-react';

export default function PrivacyPolicyPage() {
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
          <h1 className="text-2xl font-bold text-white">隐私政策</h1>
        </div>
      </div>

      <div className="glass-effect rounded-2xl p-6 border border-white/10 space-y-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-teal-500 flex items-center justify-center">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-white">NullTodo 隐私政策</h2>
            <p className="text-sm text-gray-400">最后更新：2026年5月13日</p>
          </div>
        </div>

        <div className="space-y-6 text-gray-300">
          <section>
            <h3 className="text-lg font-semibold text-white mb-3">1. 概述</h3>
            <p className="text-sm leading-relaxed">
              我们非常重视您的隐私。本隐私政策说明了NullTodo如何收集、使用和保护您的个人信息。
            </p>
          </section>

          <section>
            <h3 className="text-lg font-semibold text-white mb-3">2. 信息收集</h3>
            <p className="text-sm leading-relaxed mb-2">我们可能收集以下类型的信息：</p>
            <ul className="list-disc list-inside text-sm space-y-1">
              <li>您创建的任务内容和设置</li>
              <li>设备信息（如设备型号、操作系统版本）</li>
              <li>应用使用统计数据</li>
            </ul>
          </section>

          <section>
            <h3 className="text-lg font-semibold text-white mb-3">3. 数据存储</h3>
            <p className="text-sm leading-relaxed">
              您的所有任务数据默认存储在您的本地设备上。如果您启用了备份功能，数据可能会存储在您配置的服务器上。
              我们不会将您的数据上传到我们的服务器，除非您明确选择这样做。
            </p>
          </section>

          <section>
            <h3 className="text-lg font-semibold text-white mb-3">4. 数据使用</h3>
            <p className="text-sm leading-relaxed">
              我们使用收集的信息来：
            </p>
            <ul className="list-disc list-inside text-sm space-y-1 mt-2">
              <li>提供和改进我们的服务</li>
              <li>分析应用使用情况以优化用户体验</li>
              <li>提供个性化的任务建议</li>
            </ul>
          </section>

          <section>
            <h3 className="text-lg font-semibold text-white mb-3">5. 数据共享</h3>
            <p className="text-sm leading-relaxed">
              我们不会出售、交易或以其他方式向第三方转让您的个人信息，除非：
            </p>
            <ul className="list-disc list-inside text-sm space-y-1 mt-2">
              <li>获得您的明确同意</li>
              <li>法律法规要求</li>
              <li>保护我们的权利</li>
            </ul>
          </section>

          <section>
            <h3 className="text-lg font-semibold text-white mb-3">6. AI服务</h3>
            <p className="text-sm leading-relaxed">
              当您使用AI相关功能时，您的任务内容可能会被发送到AI服务提供商进行处理。
              我们会确保这些服务提供商遵守严格的隐私保护标准。
            </p>
          </section>

          <section>
            <h3 className="text-lg font-semibold text-white mb-3">7. 数据安全</h3>
            <p className="text-sm leading-relaxed">
              我们采取合理的安全措施来保护您的个人信息。但请注意，没有任何方法可以保证100%的安全。
            </p>
          </section>

          <section>
            <h3 className="text-lg font-semibold text-white mb-3">8. 您的权利</h3>
            <p className="text-sm leading-relaxed">
              您有权访问、更正或删除您的个人数据。您可以通过应用内的设置来管理您的数据。
            </p>
          </section>

          <section>
            <h3 className="text-lg font-semibold text-white mb-3">9. 儿童隐私</h3>
            <p className="text-sm leading-relaxed">
              我们的服务不面向13岁以下的儿童。我们不会故意收集儿童的个人信息。
            </p>
          </section>

          <section>
            <h3 className="text-lg font-semibold text-white mb-3">10. 政策变更</h3>
            <p className="text-sm leading-relaxed">
              我们可能会不时更新本隐私政策。我们会通过应用内通知告知您重大变更。
            </p>
          </section>

          <section>
            <h3 className="text-lg font-semibold text-white mb-3">11. 联系我们</h3>
            <p className="text-sm leading-relaxed">
              如有任何隐私相关问题，请通过应用内反馈功能与我们联系。
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
